from src.config import SETTINGS
from src.firebase_client import FirebaseClient
from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine


SCENARIOS = {
    "normal": HealthReading(
        heart_rate_bpm=76,
        spo2_pct=97,
        inactivity_minutes=5,
        activity="active",
    ),
    "warning": HealthReading(
        heart_rate_bpm=108,
        spo2_pct=94,
        inactivity_minutes=75,
        activity="inactive",
    ),
    "critical": HealthReading(
        heart_rate_bpm=82,
        spo2_pct=91,
        inactivity_minutes=20,
        activity="inactive",
    ),
    "fall": HealthReading(
        heart_rate_bpm=80,
        spo2_pct=97,
        inactivity_minutes=2,
        activity="fall_event",
        fall_detected=True,
    ),
    "sos": HealthReading(
        heart_rate_bpm=74,
        spo2_pct=98,
        sos_pressed=True,
    ),
}


def run():
    engine = ElderlyCareAIEngine()
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )

    print("\nSMART ELDERLY CARE - HEALTH SIMULATION")
    print("=" * 55)

    for scenario_name, reading in SCENARIOS.items():
        result = engine.process_health(reading)
        health = result["health"]
        alert = result["alert"]

        firebase.update_health_result(result)

        print(f"\nScenario  : {scenario_name.upper()}")
        print(f"Heart Rate: {reading.heart_rate_bpm} BPM")
        print(f"SpO2      : {reading.spo2_pct}%")
        print(f"Inactivity: {reading.inactivity_minutes} minutes")
        print(f"Status    : {health['status']}")
        print(f"Risk Score: {health['risk_score']}")
        print(f"Reasons   : {', '.join(health['reasons'])}")
        print(f"Alert     : {health['requires_alert']}")

        if alert is not None:
            print(f"Alert Type: {alert['type']}")
            print(f"Severity  : {alert['severity']}")
            print(f"Message   : {alert['message']}")
        else:
            print("Alert Type: No Alert")


if __name__ == "__main__":
    run()