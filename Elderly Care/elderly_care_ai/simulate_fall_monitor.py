import argparse

import pandas as pd

from src.config import SETTINGS
from src.firebase_client import FirebaseClient
from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine


def run(scenario="both"):
    engine = ElderlyCareAIEngine()
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )

    test_data = pd.read_csv("data/Test.csv")

    scenarios = {
        "recorded_fall": test_data[test_data["fall"] == 1].iloc[0],
        "recorded_no_fall": test_data[test_data["fall"] == 0].iloc[0],
    }
    if scenario == "fall":
        scenarios = {"recorded_fall": scenarios["recorded_fall"]}
    elif scenario == "no-fall":
        scenarios = {"recorded_no_fall": scenarios["recorded_no_fall"]}

    print("\nSMART ELDERLY CARE - FALL MODEL SIMULATION")
    print("=" * 58)

    for scenario_name, row in scenarios.items():
        features = {
            feature_name: float(row[feature_name])
            for feature_name in engine.fall_model.feature_names
        }

        window_id = firebase.publish_movement_window(
            features,
            source=f"simulator:{scenario_name}",
        )
        uploaded_window = firebase.get_movement_window(window_id)
        if uploaded_window is not None:
            features = uploaded_window["features"]

        reading = HealthReading(
            heart_rate_bpm=80,
            spo2_pct=97,
            inactivity_minutes=2,
            activity=scenario_name,
        )

        result = engine.process_fall(features, reading)
        fall = result["fall"]
        health = result["health"]
        alert = result["alert"]

        firebase.update_fall_prediction(
            fall["label"],
            fall["probability"],
        )
        firebase.update_health_result(result)

        actual_label = (
            "fall"
            if int(row["fall"]) == 1
            else "no_fall"
        )

        print(f"\nScenario    : {scenario_name.upper()}")
        print(f"Window ID   : {window_id or 'local-only'}")
        print(f"Actual      : {actual_label}")
        print(f"Prediction  : {fall['label']}")
        print(f"Probability : {fall['probability']:.4f}")
        print(f"Fall Detected: {fall['fall_detected']}")
        print(f"Health Status: {health['status']}")
        print(f"Risk Score  : {health['risk_score']}")
        print(f"Event Codes : {health['event_codes']}")

        if alert is not None:
            print(f"Alert Type  : {alert['type']}")
            print(f"Severity    : {alert['severity']}")
            print(f"Message     : {alert['message']}")
        else:
            print("Alert Type  : No Alert")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish dummy fall windows.")
    parser.add_argument(
        "--scenario",
        choices=("both", "fall", "no-fall"),
        default="both",
    )
    args = parser.parse_args()
    run(args.scenario)
