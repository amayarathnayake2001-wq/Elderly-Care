import argparse
import time

from src.config import SETTINGS
from src.firebase_client import FirebaseClient
from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine


REQUIRED_FIELDS = ("heart_rate_bpm", "spo2_pct")


def process_reading(engine, firebase, payload):
    missing = [name for name in REQUIRED_FIELDS if name not in payload]
    if missing:
        raise ValueError(f"Missing vital sensor fields: {missing}")

    reading = HealthReading(
        heart_rate_bpm=float(payload["heart_rate_bpm"]),
        spo2_pct=float(payload["spo2_pct"]),
        inactivity_minutes=float(payload.get("inactivity_minutes", 0)),
        activity=str(payload.get("activity", "arduino_sensor_reading")),
        sensor_valid=bool(payload.get("sensor_valid", True)),
    )
    result = engine.process_health(reading)
    firebase.update_health_result(result)
    return result


def reading_id(payload):
    return payload.get("reading_id") or payload.get("timestamp")


def run(once=False, poll_seconds=1.0):
    engine = ElderlyCareAIEngine()
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )
    if not firebase.ready:
        raise RuntimeError("Firebase must be configured for vitals monitoring.")

    last_reading_id = None
    print("[RUN] Watching Firebase vital sensor data. Press Ctrl+C to stop.")
    while True:
        payload = firebase.get_latest_sensor_reading()
        current_id = reading_id(payload) if payload else None
        if payload and current_id != last_reading_id:
            try:
                result = process_reading(engine, firebase, payload)
                health = result["health"]
                print(
                    f"[VITALS] reading={current_id}, "
                    f"heart_rate={float(payload['heart_rate_bpm']):.1f}, "
                    f"spo2={float(payload['spo2_pct']):.1f}, "
                    f"status={health['status']}, "
                    f"risk={health['risk_score']}"
                )
            except (TypeError, ValueError) as exc:
                print(f"[VITALS] Invalid reading {current_id}: {exc}")
            last_reading_id = current_id
            if once:
                return
        elif once:
            raise RuntimeError("No new vital sensor reading exists in Firebase.")
        time.sleep(poll_seconds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor Firebase vitals.")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--poll-seconds", type=float, default=1.0)
    args = parser.parse_args()
    run(once=args.once, poll_seconds=args.poll_seconds)
