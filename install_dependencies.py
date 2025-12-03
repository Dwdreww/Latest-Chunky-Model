# install_dependencies.py

import subprocess
import sys

def install(package):
    """Install a package using pip."""
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def uninstall(package):
    """Uninstall a package using pip."""
    subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", package])

# -----------------------------
# 1️⃣ Core libraries
# -----------------------------
install("numpy")
install("pandas")
install("matplotlib")
install("seaborn")
install("tqdm")
install("scikit-learn")
install("accelerate==1.11.0")

# -----------------------------
# 2️⃣ Transformers
# -----------------------------
install("transformers==4.45.2")

# -----------------------------
# 3️⃣ Detect GPU and install PyTorch accordingly
# -----------------------------
print("\n[INFO] Detecting GPU for PyTorch installation...")

try:
    import torch
    print("[INFO] PyTorch is already installed. Uninstalling first...")
    uninstall("torch")
    uninstall("torchvision")
    uninstall("torchaudio")
except ImportError:
    print("[INFO] PyTorch not installed. Proceeding with installation.")

has_cuda = False
try:
    result = subprocess.run(["nvidia-smi"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode == 0:
        has_cuda = True
except Exception:
    has_cuda = False

if has_cuda:
    print("[INFO] NVIDIA GPU detected! Installing PyTorch with CUDA 12.1 support...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install",
        "torch==2.5.1+cu121",
        "torchvision==0.20.1+cu121",
        "torchaudio==2.5.1+cu121",
        "--index-url", "https://download.pytorch.org/whl/cu121"
    ])

else:
    print("[INFO] No NVIDIA GPU detected. Installing CPU-only PyTorch...")
    install("torch")
    install("torchvision")
    install("torchaudio")

# -----------------------------
# 4️⃣ Gradio for deployment
# -----------------------------
install("gradio")

print("\n✅ All dependencies installed successfully!")