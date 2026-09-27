import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    camera_index: int = int(os.getenv("CAMERA_INDEX", "0"))
    camera_width: int = int(os.getenv("CAMERA_WIDTH", "640"))
    camera_height: int = int(os.getenv("CAMERA_HEIGHT", "480"))
    min_emotion_confidence: float = float(
        os.getenv("MIN_EMOTION_CONFIDENCE", "40")
    )
    emotion_stability_seconds: float = float(
        os.getenv("EMOTION_STABILITY_SECONDS", "4")
    )
    emotion_window_size: int = int(os.getenv("EMOTION_WINDOW_SIZE", "15"))
    analyze_every_n_frames: int = int(os.getenv("ANALYZE_EVERY_N_FRAMES", "5"))
    firebase_credentials_path: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    firebase_database_url: str = os.getenv("FIREBASE_DATABASE_URL", "")
    elderly_id: str = os.getenv("ELDERLY_ID", "elderly_001")


SETTINGS = Settings()

