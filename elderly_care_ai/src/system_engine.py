from datetime import datetime, timezone
from pathlib import Path


from .alert_engine import AlertDecisionEngine
from .health_anomaly import HealthReading, HealthRiskEngine
from .fall_model import FallModel

class ElderlyCareAIEngine:

    def __init__(self):
        self.health_engine = HealthRiskEngine()
        self.alert_engine = AlertDecisionEngine()
        model_path = Path(__file__).resolve().parents[1] / "models" / "fall_model.joblib"
        self.fall_model = FallModel(model_path)

    def process_health(self, reading: HealthReading):
        assessment = self.health_engine.assess(reading)
        alert = self.alert_engine.create_alert(assessment)
        result = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "health": {
                    "status": assessment.status.value,
                    "risk_score": assessment.risk_score,
                    "reasons": assessment.reasons,
                    "event_codes": assessment.event_codes,
                    "requires_alert": assessment.requires_alert
                },
                "alert": None
            }
        if alert is not None:
                result["alert"] = {
                    "type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message
                }

        return result

    def process_fall(self, features: dict, reading: HealthReading):
        label, probability = self.fall_model.predict(features)
        reading.fall_detected = label == "fall"
        result = self.process_health(reading)

        result["fall"] = {
            "label": label,
            "probability": round(probability, 4),
            "fall_detected": reading.fall_detected
        }

        return result

    def process_mood(self, emotion: str, confidence: float, backend: str):
        normalized_emotion = emotion.strip().lower()
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mood": {
                "emotion": normalized_emotion,
                "confidence": round(float(confidence), 2),
                "backend": backend,
                "model": "DeepFace pretrained emotion model"
            }
        }