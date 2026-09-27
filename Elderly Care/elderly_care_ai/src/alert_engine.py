from dataclasses import dataclass

from .health_anomaly import HealthAssessment, HealthStatus


@dataclass
class AlertEvent:
    alert_type: str
    severity: str
    message: str
    assessment: HealthAssessment


class AlertDecisionEngine:
    ALERT_PRIORITY = (
        ("SOS_EMERGENCY", "SOS_EMERGENCY"),
        ("FALL_DETECTED", "FALL_DETECTED"),
        ("LOW_SPO2_CRITICAL", "LOW_SPO2_CRITICAL"),
        ("SENSOR_INVALID", "SENSOR_WARNING"),
        ("LOW_SPO2_WARNING", "LOW_SPO2_WARNING"),
        ("HEART_RATE_OUT_OF_RANGE", "HEART_RATE_WARNING"),
        ("INACTIVITY_WARNING", "INACTIVITY_WARNING"),
    )

    @classmethod
    def _select_alert_type(cls, assessment: HealthAssessment) -> str:
        event_codes = set(assessment.event_codes)

        for event_code, alert_type in cls.ALERT_PRIORITY:
            if event_code in event_codes:
                return alert_type

        if assessment.status == HealthStatus.CRITICAL:
            return "HEALTH_CRITICAL"

        return "HEALTH_WARNING"

    def create_alert(
        self,
        assessment: HealthAssessment,
    ) -> AlertEvent | None:
        if not assessment.requires_alert:
            return None

        severity = (
            "critical"
            if assessment.status == HealthStatus.CRITICAL
            else "warning"
        )

        return AlertEvent(
            alert_type=self._select_alert_type(assessment),
            severity=severity,
            message="; ".join(assessment.reasons),
            assessment=assessment,
        )