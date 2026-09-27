import unittest

from src.health_anomaly import HealthReading
from src.system_engine import ElderlyCareAIEngine
class SystemEngineTests(unittest.TestCase):

    def setUp(self):
        self.engine = ElderlyCareAIEngine()

    def test_normal_health_result(self):
        reading = HealthReading(
            heart_rate_bpm=76,
            spo2_pct=97
        )

        result = self.engine.process_health(reading)

        self.assertEqual(result["health"]["status"], "NORMAL")
        self.assertEqual(result["health"]["risk_score"], 0)
        self.assertIsNone(result["alert"])

    def test_fall_creates_critical_alert(self):
        reading = HealthReading(
            heart_rate_bpm=80,
            spo2_pct=97,
            fall_detected=True
        )
        result = self.engine.process_health(reading)

        self.assertEqual(result["health"]["status"], "CRITICAL")
        self.assertIsNotNone(result["alert"])
        self.assertEqual(result["alert"]["type"], "FALL_DETECTED")
        self.assertIn("FALL_DETECTED", result["health"]["event_codes"])

    def test_mood_result(self):
        result = self.engine.process_mood(
            emotion="Neutral",
            confidence=91.234,
            backend="retinaface"
        )

        self.assertEqual(result["mood"]["emotion"], "neutral")
        self.assertEqual(result["mood"]["confidence"], 91.23)
        self.assertEqual(result["mood"]["backend"], "retinaface")