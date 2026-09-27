import pytest

from src.mpu6050_features import MPU6050Window, extract_mpu6050_features


def sample(ax=0.0, ay=0.0, az=1.0, gx=0.0, gy=0.0, gz=0.0):
    return {"ax": ax, "ay": ay, "az": az, "gx": gx, "gy": gy, "gz": gz}


def test_stationary_sensor_in_g_has_gravity_and_zero_linear_acceleration():
    features = extract_mpu6050_features([sample()] * 10, "g")
    assert features["acc_max"] == pytest.approx(9.80665)
    assert features["lin_max"] == pytest.approx(0.0)
    assert features["acc_skewness"] == 0.0
    assert features["acc_kurtosis"] == 0.0


def test_impact_and_post_impact_features_are_extracted():
    samples = [sample(), sample(ax=3), sample(gx=10), sample(gx=4)]
    features = extract_mpu6050_features(samples, "g")
    assert features["acc_max"] > 29
    assert features["post_gyro_max"] == pytest.approx(10.0)
    assert features["post_lin_max"] == pytest.approx(0.0)


def test_overlapping_window_emits_at_configured_step():
    window = MPU6050Window(size=4, step=2)
    assert [window.add(sample()) for _ in range(3)] == [None, None, None]
    assert window.add(sample()) is not None
    assert window.add(sample()) is None
    assert window.add(sample()) is not None
