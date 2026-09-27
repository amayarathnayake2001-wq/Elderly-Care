import unittest

from src.emotion_smoother import EmotionSmoother


class EmotionSmootherTests(unittest.TestCase):
    def test_low_confidence_is_ignored(self):
        smoother = EmotionSmoother(min_confidence=40)
        smoother.add_reading("happy", 20, now=100)
        self.assertEqual(list(smoother.buffer), [])

    def test_continuous_emotion_stabilizes_after_four_seconds(self):
        smoother = EmotionSmoother(
            stability_seconds=4,
            max_reading_gap_seconds=2.5,
            min_readings=3,
        )

        for timestamp in (100.0, 101.5, 103.0):
            smoother.add_reading("neutral", 90, now=timestamp)
            stable, _, changed = smoother.update(now=timestamp)
            self.assertIsNone(stable)
            self.assertFalse(changed)

        smoother.add_reading("neutral", 90, now=104.1)
        stable, confidence, changed = smoother.update(now=104.1)

        self.assertEqual(stable, "neutral")
        self.assertEqual(confidence, 90)
        self.assertTrue(changed)

    def test_stale_single_reading_does_not_stabilize(self):
        smoother = EmotionSmoother(
            stability_seconds=4,
            max_reading_gap_seconds=2.5,
            min_readings=3,
        )

        smoother.add_reading("happy", 85, now=100)
        self.assertEqual(smoother.update(now=100), (None, 85, False))

        stable, confidence, changed = smoother.update(now=104.1)

        self.assertIsNone(stable)
        self.assertEqual(confidence, 0.0)
        self.assertFalse(changed)

    def test_long_detection_gap_resets_candidate(self):
        smoother = EmotionSmoother(
            stability_seconds=4,
            max_reading_gap_seconds=2.5,
            min_readings=3,
        )

        smoother.add_reading("sad", 80, now=100)
        smoother.update(now=100)

        smoother.add_reading("sad", 80, now=103)
        stable, confidence, changed = smoother.update(now=103)

        self.assertIsNone(stable)
        self.assertEqual(confidence, 80)
        self.assertFalse(changed)

    def test_one_reading_is_not_enough_with_slow_detector(self):
        smoother = EmotionSmoother(
            stability_seconds=4,
            max_reading_gap_seconds=8,
            min_readings=3,
        )

        smoother.add_reading("neutral", 84, now=100)
        smoother.update(now=100)

        stable, confidence, changed = smoother.update(now=104.1)

        self.assertIsNone(stable)
        self.assertEqual(confidence, 84)
        self.assertFalse(changed)

    def test_three_slow_readings_can_stabilize(self):
        smoother = EmotionSmoother(
            stability_seconds=4,
            max_reading_gap_seconds=8,
            min_readings=3,
        )

        for timestamp in (100.0, 103.0, 106.0):
            smoother.add_reading("neutral", 84, now=timestamp)
            stable, confidence, changed = smoother.update(now=timestamp)

        self.assertEqual(stable, "neutral")
        self.assertEqual(confidence, 84)
        self.assertTrue(changed)


if __name__ == "__main__":
    unittest.main()