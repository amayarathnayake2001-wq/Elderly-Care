from __future__ import annotations

from collections import deque
from typing import Iterable

import numpy as np
import pandas as pd


RAW_FIELDS = ("ax", "ay", "az", "gx", "gy", "gz")


def _shape(values: np.ndarray) -> tuple[float, float]:
    """Return sample skewness and excess kurtosis, safely for flat signals."""
    series = pd.Series(values)
    skewness = float(series.skew())
    kurtosis = float(series.kurt())
    return (
        0.0 if not np.isfinite(skewness) else skewness,
        0.0 if not np.isfinite(kurtosis) else kurtosis,
    )


def extract_mpu6050_features(
    samples: Iterable[dict[str, float]],
    acceleration_unit: str = "m/s2",
) -> dict[str, float]:
    """Convert one MPU6050 time window into the trained model's nine features.

    Gyroscope values are expected in degrees/second. Acceleration may be supplied
    in m/s2 or g. ``lin`` is an MPU6050 approximation: magnitude with 1 g removed.
    """
    rows = list(samples)
    if len(rows) < 4:
        raise ValueError("At least 4 MPU6050 samples are required per window.")

    try:
        matrix = np.asarray(
            [[float(row[name]) for name in RAW_FIELDS] for row in rows],
            dtype=float,
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError(f"Each sample must contain numeric fields: {RAW_FIELDS}") from exc
    if not np.isfinite(matrix).all():
        raise ValueError("MPU6050 samples cannot contain NaN or infinite values.")

    acceleration = matrix[:, :3]
    unit = acceleration_unit.strip().lower()
    if unit == "g":
        acceleration = acceleration * 9.80665
    elif unit not in {"m/s2", "m/s^2"}:
        raise ValueError("acceleration_unit must be 'g' or 'm/s2'.")

    acc_magnitude = np.linalg.norm(acceleration, axis=1)
    gyro_magnitude = np.linalg.norm(matrix[:, 3:], axis=1)
    linear_magnitude = np.abs(acc_magnitude - 9.80665)
    acc_skewness, acc_kurtosis = _shape(acc_magnitude)
    gyro_skewness, gyro_kurtosis = _shape(gyro_magnitude)

    impact_index = int(np.argmax(acc_magnitude))
    post_start = min(impact_index + 1, len(rows) - 1)

    return {
        "acc_max": float(np.max(acc_magnitude)),
        "gyro_max": float(np.max(gyro_magnitude)),
        "acc_kurtosis": acc_kurtosis,
        "gyro_kurtosis": gyro_kurtosis,
        "lin_max": float(np.max(linear_magnitude)),
        "acc_skewness": acc_skewness,
        "gyro_skewness": gyro_skewness,
        "post_gyro_max": float(np.max(gyro_magnitude[post_start:])),
        "post_lin_max": float(np.max(linear_magnitude[post_start:])),
    }


class MPU6050Window:
    """Collect fixed-size, optionally overlapping MPU6050 sample windows."""

    def __init__(self, size: int = 100, step: int | None = None):
        if size < 4:
            raise ValueError("Window size must be at least 4.")
        self.size = size
        self.step = size if step is None else step
        if not 1 <= self.step <= self.size:
            raise ValueError("Window step must be between 1 and window size.")
        self._samples: deque[dict[str, float]] = deque(maxlen=size)
        self._since_last = 0

    def add(self, sample: dict[str, float]) -> list[dict[str, float]] | None:
        self._samples.append(sample)
        self._since_last += 1
        if len(self._samples) == self.size and self._since_last >= self.step:
            self._since_last = 0
            return list(self._samples)
        return None
