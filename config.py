import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'db': os.getenv('DB_NAME', 'report_db'),
    'charset': 'utf8mb4',
    'autocommit': True
}

# Upload Configuration
UPLOAD_DIR = BASE_DIR / 'uploads'
BEFORE_IMAGE_DIR = UPLOAD_DIR / 'before'
AFTER_IMAGE_DIR = UPLOAD_DIR / 'after'

# Create upload directories if they don't exist
BEFORE_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
AFTER_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image formats
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Max file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]
