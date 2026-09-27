import unittest

from src.health_anomaly import (
    HealthReading,
    HealthRiskEngine,
    HealthStatus
)


class HealthAnomalyTests(unittest.TestCase):

    def setUp(self):
        self.engine = HealthRiskEngine()

    def test_normal_status(self):
        reading = HealthReading(
            heart_rate_bpm=76,
            spo2_pct=97,
            inactivity_minutes=5,
            activity="active"
        )
    

        result = self.engine.assess(reading)

        self.assertEqual(result.status, HealthStatus.NORMAL)
        self.assertFalse(result.requires_alert)

    def test_warning_status(self):
        reading = HealthReading(
            heart_rate_bpm=108,
            spo2_pct=94,
            inactivity_minutes=75,
            activity="inactive"
        )
        result = self.engine.assess(reading)

        self.assertEqual(result.status, HealthStatus.WARNING)
        self.assertTrue(result.requires_alert)
    def test_critical_status(self):
        reading = HealthReading(
            heart_rate_bpm=82,
            spo2_pct=91,
            inactivity_minutes=20,
            activity="inactive"
        )

        result = self.engine.assess(reading)

        self.assertEqual(result.status, HealthStatus.CRITICAL)
        self.assertTrue(result.requires_alert)
        
