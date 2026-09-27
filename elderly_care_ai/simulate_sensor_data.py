import argparse

from src.config import SETTINGS
from src.firebase_client import FirebaseClient
from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine


def run(heart_rate, spo2, temperature, humidity, mood, confidence):
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )
    engine = ElderlyCareAIEngine()

    sensors_ok = firebase.publish_sensor_reading(
        heart_rate_bpm=heart_rate,
        spo2_pct=spo2,
        temperature_c=temperature,
        humidity_pct=humidity,
        source="simulator",
    )
    health_result = engine.process_health(
        HealthReading(
            heart_rate_bpm=heart_rate,
            spo2_pct=spo2,
            activity="simulated_sensor_reading",
        )
    )
    health_ok = firebase.update_health_result(health_result)
    mood_ok = firebase.update_mood(mood, confidence, "simulator")

    print("\nSMART ELDERLY CARE - SENSOR SIMULATION")
    print("=" * 52)
    print(f"Heart rate : {heart_rate:.1f} bpm")
    print(f"SpO2       : {spo2:.1f}%")
    print(f"Temperature: {temperature:.1f} C")
    print(f"Humidity   : {humidity:.1f}%")
    print(f"Mood       : {mood} ({confidence:.1f}%)")
    print(f"Health     : {health_result['health']['status']}")
    print(f"Firebase   : {'uploaded' if all((sensors_ok, health_ok, mood_ok)) else 'local/failed'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish dummy sensor data.")
    parser.add_argument("--heart-rate", type=float, default=78.0)
    parser.add_argument("--spo2", type=float, default=98.0)
    parser.add_argument("--temperature", type=float, default=27.5)
    parser.add_argument("--humidity", type=float, default=62.0)
    parser.add_argument("--mood", default="neutral")
    parser.add_argument("--confidence", type=float, default=91.0)
    args = parser.parse_args()
    run(
        args.heart_rate,
        args.spo2,
        args.temperature,
        args.humidity,
        args.mood,
        args.confidence,
    )
