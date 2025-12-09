import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import confusion_matrix, classification_report

# -----------------------------
# 1️⃣ Load dataset
# -----------------------------
data = pd.read_csv("train.csv")
label_cols = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']

# Fill missing text with empty strings
texts = data["comment_text"].fillna("")
labels = data[label_cols]

# -----------------------------
# 2️⃣ TF-IDF Vectorization
# -----------------------------
tfidf = TfidfVectorizer(max_features=50000)
X = tfidf.fit_transform(texts)

# Save the TF-IDF vectorizer
joblib.dump(tfidf, "tfidf_vectorizer.joblib")
print("✅ TF-IDF vectorizer saved as tfidf_vectorizer.joblib")

# -----------------------------
# 3️⃣ Train Naive Bayes models per label
# -----------------------------
models = {}
for label in label_cols:
    print(f"Training Naive Bayes model for '{label}'...")
    y = labels[label]
    model = MultinomialNB()
    model.fit(X, y)
    joblib.dump(model, f"nb_model_{label}.joblib")
    models[label] = model

print("✅ All Naive Bayes models trained and saved!")

# -----------------------------
# 4️⃣ Evaluate all models
# -----------------------------
print("\n📊 Confusion Matrices & Classification Reports:")

for label in label_cols:
    model = models[label]
    y_true = labels[label]
    y_pred = model.predict(X)
    
    print(f"\nLabel: {label}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))
    print("Classification Report:")
    print(classification_report(y_true, y_pred, digits=4))
