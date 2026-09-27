import unittest

from src.alert_engine import AlertDecisionEngine
from src.health_anomaly import HealthAssessment, HealthStatus

class AlertEngineTests(unittest.TestCase):

    def setUp(self):
        self.engine = AlertDecisionEngine()

    def test_normal_assessment_creates_no_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.NORMAL,
            risk_score=0,
            reasons=["Readings are normal"],
            requires_alert=False
        )

        alert = self.engine.create_alert(assessment)

        self.assertIsNone(alert)

    def test_critical_assessment_creates_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.CRITICAL,
            risk_score=100,
            reasons=["Possible fall detected"],
            requires_alert=True
        )

        alert = self.engine.create_alert(assessment)

        self.assertIsNotNone(alert)
        self.assertEqual(alert.alert_type, "HEALTH_CRITICAL")
        self.assertEqual(alert.severity, "critical")

    def test_fall_event_creates_fall_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.CRITICAL,
            risk_score=100,
            reasons=["Possible fall detected"],
            requires_alert=True,
            event_codes=["FALL_DETECTED"],
        )

        alert = self.engine.create_alert(assessment)

        self.assertEqual(alert.alert_type, "FALL_DETECTED")
        self.assertEqual(alert.severity, "critical")

    def test_sos_event_creates_sos_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.CRITICAL,
            risk_score=100,
            reasons=["Manual SOS button pressed"],
            requires_alert=True,
            event_codes=["SOS_EMERGENCY"],
        )

        alert = self.engine.create_alert(assessment)

        self.assertEqual(alert.alert_type, "SOS_EMERGENCY")
        self.assertEqual(alert.severity, "critical")

    def test_low_spo2_creates_specific_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.CRITICAL,
            risk_score=100,
            reasons=["Oxygen saturation reached critical threshold"],
            requires_alert=True,
            event_codes=["LOW_SPO2_CRITICAL"],
        )

        alert = self.engine.create_alert(assessment)

        self.assertEqual(alert.alert_type, "LOW_SPO2_CRITICAL")
        self.assertEqual(alert.severity, "critical")

    def test_inactivity_creates_warning_alert(self):
        assessment = HealthAssessment(
            status=HealthStatus.WARNING,
            risk_score=25,
            reasons=["Unusual inactivity duration"],
            requires_alert=True,
            event_codes=["INACTIVITY_WARNING"],
        )

        alert = self.engine.create_alert(assessment)

        self.assertEqual(alert.alert_type, "INACTIVITY_WARNING")
        self.assertEqual(alert.severity, "warning")