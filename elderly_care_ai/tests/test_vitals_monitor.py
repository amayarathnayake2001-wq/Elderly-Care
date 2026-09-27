import unittest
from unittest.mock import Mock

from run_vitals_monitor import process_reading, reading_id


class VitalsMonitorTests(unittest.TestCase):
    def test_processes_required_fields_and_writes_health(self):
        engine = Mock()
        firebase = Mock()
        expected = {"health": {"status": "NORMAL", "risk_score": 0}}
        engine.process_health.return_value = expected

        result = process_reading(
            engine,
            firebase,
            {"heart_rate_bpm": 78, "spo2_pct": 98, "timestamp": "t1"},
        )

        self.assertEqual(result, expected)
        firebase.update_health_result.assert_called_once_with(expected)

    def test_rejects_reading_without_spo2(self):
        with self.assertRaisesRegex(ValueError, "spo2_pct"):
            process_reading(Mock(), Mock(), {"heart_rate_bpm": 78})

    def test_timestamp_identifies_a_new_reading(self):
        self.assertEqual(reading_id({"timestamp": "t1"}), "t1")


if __name__ == "__main__":
    unittest.main()
