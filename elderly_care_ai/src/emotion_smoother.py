import collections
import time


class EmotionSmoother:
    """Confidence-weighted emotion smoothing with continuous evidence."""

    def __init__(
        self,
        window_size: int = 15,
        min_confidence: float = 40.0,
        stability_seconds: float = 4.0,
        max_reading_gap_seconds: float = 8.0,
        min_readings: int = 3,
    ):
        self.buffer = collections.deque(maxlen=window_size)
        self.min_confidence = min_confidence
        self.stability_seconds = stability_seconds
        self.max_reading_gap_seconds = max_reading_gap_seconds
        self.min_readings = min_readings

        self.stable_emotion = None
        self.candidate_emotion = None
        self.candidate_since = None
        self.last_reading_at = None

    def add_reading(
        self,
        emotion: str,
        confidence: float,
        now: float | None = None,
    ) -> None:
        if not emotion or confidence < self.min_confidence:
            return

        timestamp = time.monotonic() if now is None else now

        if (
            self.last_reading_at is not None
            and timestamp - self.last_reading_at
            > self.max_reading_gap_seconds
        ):
            self.buffer.clear()
            self.candidate_emotion = None
            self.candidate_since = None

        normalized_emotion = emotion.strip().lower()
        self.buffer.append(
            (normalized_emotion, float(confidence), timestamp)
        )
        self.last_reading_at = timestamp

    def reset(self) -> None:
        self.buffer.clear()
        self.stable_emotion = None
        self.candidate_emotion = None
        self.candidate_since = None
        self.last_reading_at = None

    def _majority(self):
        if not self.buffer:
            return None, 0.0

        weights = collections.defaultdict(float)
        counts = collections.defaultdict(int)

        for emotion, confidence, _ in self.buffer:
            weights[emotion] += confidence
            counts[emotion] += 1

        best = max(weights, key=weights.get)
        average_confidence = weights[best] / counts[best]
        return best, average_confidence

    def update(self, now: float | None = None):
        now = time.monotonic() if now is None else now

        if (
            self.last_reading_at is None
            or now - self.last_reading_at
            > self.max_reading_gap_seconds
        ):
            self.buffer.clear()
            self.candidate_emotion = None
            self.candidate_since = None
            return self.stable_emotion, 0.0, False

        majority_emotion, average_confidence = self._majority()
        if majority_emotion is None:
            return self.stable_emotion, 0.0, False

        majority_reading_count = sum(
            1
            for emotion, _, _ in self.buffer
            if emotion == majority_emotion
        )

        if majority_emotion != self.candidate_emotion:
            self.candidate_emotion = majority_emotion
            self.candidate_since = now

        held_long_enough = (
            self.candidate_since is not None
            and majority_reading_count >= self.min_readings
            and now - self.candidate_since >= self.stability_seconds
        )

        changed = False
        if held_long_enough and self.stable_emotion != majority_emotion:
            self.stable_emotion = majority_emotion
            changed = True

        return self.stable_emotion, average_confidence, changed