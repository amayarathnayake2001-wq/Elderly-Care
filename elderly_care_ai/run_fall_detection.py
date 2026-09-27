import argparse
import time

from src.config import SETTINGS
from src.firebase_client import FirebaseClient
from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine


def process_window(engine, firebase, payload):
    features = payload.get("features", {})
    reading = HealthReading(
        heart_rate_bpm=80,
        spo2_pct=97,
        inactivity_minutes=0,
        activity="movement_window",
    )
    result = engine.process_fall(features, reading)
    fall = result["fall"]
    firebase.update_fall_prediction(fall["label"], fall["probability"])
    firebase.update_health_result(result)
    return result


def run(once=False, poll_seconds=1.0):
    engine = ElderlyCareAIEngine()
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )
    if not firebase.ready:
        raise RuntimeError("Firebase must be configured for live fall monitoring.")

    last_window_id = None
    print("[RUN] Watching Firebase movement windows. Press Ctrl+C to stop.")
    while True:
        payload = firebase.get_movement_window()
        if payload:
            window_id = payload.get("window_id") or payload.get("timestamp")
            if window_id != last_window_id:
                result = process_window(engine, firebase, payload)
                fall = result["fall"]
                print(
                    f"[FALL] window={window_id}, prediction={fall['label']}, "
                    f"probability={fall['probability']:.4f}"
                )
                last_window_id = window_id
                if once:
                    return
        elif once:
            raise RuntimeError("No movement window exists in Firebase.")
        time.sleep(poll_seconds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor Firebase for falls.")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--poll-seconds", type=float, default=1.0)
    args = parser.parse_args()
    run(once=args.once, poll_seconds=args.poll_seconds)
