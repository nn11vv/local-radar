import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
API_PORT = int(os.getenv("API_PORT", "8000"))

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set in .env")
