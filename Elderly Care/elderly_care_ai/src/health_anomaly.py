from dataclasses import dataclass, field
from enum import Enum


class HealthStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


@dataclass
class HealthThresholds:
    spo2_normal_min: float = 95.0
    spo2_critical_max: float = 92.0
    heart_rate_min: float = 60.0
    heart_rate_max: float = 100.0
    inactivity_warning_minutes: float = 60.0


@dataclass
class HealthReading:
    heart_rate_bpm: float
    spo2_pct: float
    inactivity_minutes: float = 0.0
    activity: str = "unknown"
    fall_detected: bool = False
    sos_pressed: bool = False
    sensor_valid: bool = True


@dataclass
class HealthAssessment:
    status: HealthStatus
    risk_score: int
    reasons: list[str]
    requires_alert: bool
    event_codes: list[str] = field(default_factory=list)


class HealthRiskEngine:
    def __init__(self, thresholds=None):
        self.thresholds = thresholds or HealthThresholds()

    @staticmethod
    def values_are_valid(reading: HealthReading) -> bool:
        return (
            reading.sensor_valid
            and 20 <= reading.heart_rate_bpm <= 240
            and 50 <= reading.spo2_pct <= 100
            and reading.inactivity_minutes >= 0
        )

    def assess(self, reading: HealthReading) -> HealthAssessment:
        if not self.values_are_valid(reading):
            return HealthAssessment(
                status=HealthStatus.WARNING,
                risk_score=25,
                reasons=["Invalid or unavailable sensor reading"],
                requires_alert=True,
                event_codes=["SENSOR_INVALID"],
            )

        reasons = []
        event_codes = []
        warning_score = 0
        critical_event = False

        if reading.sos_pressed:
            reasons.append("Manual SOS button pressed")
            event_codes.append("SOS_EMERGENCY")
            critical_event = True

        if reading.fall_detected:
            reasons.append("Possible fall detected")
            event_codes.append("FALL_DETECTED")
            critical_event = True

        if reading.spo2_pct <= self.thresholds.spo2_critical_max:
            reasons.append(
                "Oxygen saturation reached configured critical threshold"
            )
            event_codes.append("LOW_SPO2_CRITICAL")
            critical_event = True
        elif reading.spo2_pct < self.thresholds.spo2_normal_min:
            reasons.append(
                "Oxygen saturation below configured normal range"
            )
            event_codes.append("LOW_SPO2_WARNING")
            warning_score += 35

        if not (
            self.thresholds.heart_rate_min
            <= reading.heart_rate_bpm
            <= self.thresholds.heart_rate_max
        ):
            reasons.append(
                "Resting heart rate outside configured range"
            )
            event_codes.append("HEART_RATE_OUT_OF_RANGE")
            warning_score += 25

        if (
            reading.inactivity_minutes
            >= self.thresholds.inactivity_warning_minutes
        ):
            reasons.append("Unusual inactivity duration")
            event_codes.append("INACTIVITY_WARNING")
            warning_score += 25

        if critical_event:
            status = HealthStatus.CRITICAL
            risk_score = 100
        elif warning_score > 0:
            status = HealthStatus.WARNING
            risk_score = warning_score
        else:
            status = HealthStatus.NORMAL
            risk_score = 0
            reasons.append("Readings are within configured ranges")

        return HealthAssessment(
            status=status,
            risk_score=risk_score,
            reasons=reasons,
            requires_alert=status != HealthStatus.NORMAL,
            event_codes=event_codes,
        )