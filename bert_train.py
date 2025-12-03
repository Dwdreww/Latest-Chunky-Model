import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset
from torch.nn import BCEWithLogitsLoss
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    Trainer,
    TrainingArguments,
    TrainerCallback,
    EarlyStoppingCallback
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from tqdm.auto import tqdm
import matplotlib.pyplot as plt
import transformers
import os

print("Transformers:", transformers.__version__)

# =========================================================
#  ASYMMETRIC LOSS (Optimized Version)
# =========================================================
class AsymmetricLossOptimized(nn.Module):
    def __init__(self, gamma_neg=2, gamma_pos=1, clip=0.05, eps=1e-8, pos_weight=None):
        """
        gamma_neg, gamma_pos: Focusing parameters (smaller values are less aggressive)
        clip: prevents extreme negative probabilities
        pos_weight: tensor of shape [num_labels] to weight positive examples
        """
        super().__init__()
        self.gamma_neg = gamma_neg
        self.gamma_pos = gamma_pos
        self.clip = clip
        self.eps = eps
        self.register_buffer("pos_weight", pos_weight)  # ensure it's on the same device as logits

    def forward(self, x, y):
        x_sigmoid = torch.sigmoid(x)
        xs_pos = x_sigmoid
        xs_neg = 1 - x_sigmoid

        if self.clip:
            xs_neg = (xs_neg + self.clip).clamp(max=1)

        # Standard BCE
        loss_pos = y * torch.log(xs_pos.clamp(min=self.eps))
        loss_neg = (1 - y) * torch.log(xs_neg.clamp(min=self.eps))

        # Asymmetric weighting
        pt = xs_pos * y + xs_neg * (1 - y)
        one_sided_gamma = self.gamma_pos * y + self.gamma_neg * (1 - y)
        one_sided_w = (1 - pt) ** one_sided_gamma

        loss = -(one_sided_w * (loss_pos + loss_neg))

        # Apply pos_weight if given
        if self.pos_weight is not None:
            loss = loss * (y * self.pos_weight + (1 - y))

        return loss.mean()
# =========================================================
# 1. Load dataset
# =========================================================
data = pd.read_csv("train.csv")
label_cols = ['toxic','severe_toxic','obscene','threat','insult','identity_hate']

# =========================================================
# 2. Improved stratified multilabel split
# =========================================================
stratify_labels = (data[label_cols].sum(axis=1) > 0)

train_texts, temp_texts, train_labels, temp_labels = train_test_split(
    data["comment_text"], data[label_cols], 
    test_size=0.2, random_state=42, stratify=stratify_labels
)

val_texts, test_texts, val_labels, test_labels = train_test_split(
    temp_texts, temp_labels, test_size=0.5, random_state=42
)

print("Train:", len(train_texts), "Val:", len(val_texts), "Test:", len(test_texts))
# =========================================================
# 3. Dataset class
# =========================================================
class ToxicDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts.reset_index(drop=True)
        self.labels = labels.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts.iloc[idx])
        targets = torch.tensor(self.labels.iloc[idx].values.astype(float))

        enc = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_len,
            return_tensors="pt"
        )

        item = {k: v.squeeze() for k, v in enc.items()}
        item["labels"] = targets
        return item

# =========================================================
# 4. Tokenizer / Model
# =========================================================
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=len(label_cols),
    problem_type="multi_label_classification"
)

# =========================================================
# 5. Device
# =========================================================
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print("GPU Name:", torch.cuda.get_device_name(0))
print("CUDA Capability:", torch.cuda.get_device_capability(0))

# =========================================================
# 6. Dataset objects
# =========================================================
train_dataset = ToxicDataset(train_texts, train_labels, tokenizer)
val_dataset = ToxicDataset(val_texts, val_labels, tokenizer)
test_dataset = ToxicDataset(test_texts, test_labels, tokenizer)

# =========================================================
# 7. CLASS WEIGHTS (pos_weight)
# =========================================================
pos_counts = train_labels.sum(axis=0).values
neg_counts = len(train_labels) - pos_counts
pos_weight = torch.tensor(neg_counts / (pos_counts + 1e-5), dtype=torch.float32).to(device)
loss_func = AsymmetricLossOptimized(pos_weight=pos_weight)

# =========================================================
# Trainer override for ASL
# =========================================================
class ASLTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False):
        labels = inputs.pop("labels").to(device)
        outputs = model(**inputs)
        logits = outputs.logits
        loss = loss_func(logits, labels)
        return (loss, outputs) if return_outputs else loss

# =========================================================
# 8. Metrics function
# =========================================================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    labels = torch.tensor(labels).int()
    probs = torch.sigmoid(torch.tensor(logits))

    # Compute optimal threshold per label based on validation set
    thresholds = []
    preds = torch.zeros_like(probs, dtype=torch.int)

    for i in range(probs.shape[1]):
        best_f1 = 0
        best_thresh = 0.5
        for t in np.arange(0.3, 0.7, 0.02):
            p = (probs[:, i] > t).int()
            f1 = f1_score(labels[:, i], p)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = t
        thresholds.append(best_thresh)
        preds[:, i] = (probs[:, i] > best_thresh).int()

    # Micro F1 across all labels
    micro_f1 = f1_score(labels, preds, average="micro")
    acc = accuracy_score(labels, preds)

    return {"accuracy": acc, "f1": micro_f1}


# =========================================================
# 9. Real-time plotting
# =========================================================
val_f1, val_acc = [], []

class MetricsCallback(TrainerCallback):
    def on_evaluate(self, args, state, control, metrics, **kwargs):
        val_f1.append(metrics["eval_f1"])
        val_acc.append(metrics["eval_accuracy"])

        tqdm.write(f"Epoch {state.epoch:.0f} | F1: {metrics['eval_f1']:.4f} | Acc: {metrics['eval_accuracy']:.4f}")

        plt.clf()
        plt.plot(val_f1, label="Validation F1", marker='o')
        plt.plot(val_acc, label="Validation Acc", marker='x')
        plt.legend()
        plt.grid(True)
        plt.pause(0.1)

# =========================================================
# 10. Training Args
# =========================================================
training_args = TrainingArguments(
    output_dir="./bert_toxic_model2",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,         # <<< changed
    warmup_ratio=0.1,
    weight_decay=0.01,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    gradient_accumulation_steps=2,
    fp16=True,
    num_train_epochs=8,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,
    report_to="none"
)

# =========================================================
# 11. Trainer
# =========================================================
plt.ion()
plt.figure()

trainer = ASLTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics,   # dynamic thresholding applied here
    callbacks=[
        MetricsCallback(),
        EarlyStoppingCallback(early_stopping_patience=2)
    ]
) 

# 12. Train with checkpoint resume
ckpt_path = None
if os.path.exists(training_args.output_dir):
    ckpts = [d for d in os.listdir(training_args.output_dir) if d.startswith("checkpoint")]
    if ckpts:
        # sort by checkpoint number
        def keyfn(x):
            parts = x.split("-")
            try:
                return int(parts[-1])
            except:
                return 0
        ckpts_sorted = sorted(ckpts, key=keyfn)
        ckpt_path = os.path.join(training_args.output_dir, ckpts_sorted[-1])
        print(f"🔄 Resuming from checkpoint: {ckpt_path}")

trainer.train(resume_from_checkpoint=ckpt_path)
# =========================================================
# 13. Save trained model
# =========================================================
model.save_pretrained("./bert_toxic_model_multilabel_final2")
tokenizer.save_pretrained("./bert_toxic_model_multilabel_final2")

print("✅ DONE — Model saved successfully!")
