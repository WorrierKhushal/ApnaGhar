import os
from dotenv import load_dotenv

# Load from current directory first, fallback to Express server env
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), "server", ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/apnaghar")
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
PORT = int(os.getenv("REC_PORT", 8000))

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)
