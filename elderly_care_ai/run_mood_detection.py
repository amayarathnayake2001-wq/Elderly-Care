import cv2
import time

from src.config import SETTINGS
from src.emotion_smoother import EmotionSmoother
from src.firebase_client import FirebaseClient
from src.mood_detector import MoodAnalysisWorker
from src.system_engine import ElderlyCareAIEngine
from pathlib import Path
from src.music_player import MoodMusicPlayer


def run():
    engine = ElderlyCareAIEngine()
    firebase = FirebaseClient(
        SETTINGS.firebase_credentials_path,
        SETTINGS.firebase_database_url,
        SETTINGS.elderly_id,
    )
    music_player = MoodMusicPlayer(
        Path(__file__).resolve().parent / "music",
        volume=0.5,
    )
    smoother = EmotionSmoother(
        window_size=SETTINGS.emotion_window_size,
        min_confidence=SETTINGS.min_emotion_confidence,
        stability_seconds=SETTINGS.emotion_stability_seconds,
        max_reading_gap_seconds=15.0,
        min_readings=3,
    )
    worker = MoodAnalysisWorker()

    camera = cv2.VideoCapture(SETTINGS.camera_index)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, SETTINGS.camera_width)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, SETTINGS.camera_height)
    if not camera.isOpened():
        worker.stop()
        raise RuntimeError("Could not open camera. Check the camera index/permission.")

    frame_number = 0
    last_result_id = -1
    live_label = "warming up..."
    stable_emotion = None

    print("[RUN] Mood detection started. Press q to quit.")
    try:
        while True:
            ok, frame = camera.read()
            if not ok:
                break

            # The camera driver returns a mirrored image; flip it back so the
            # preview and emotion analysis use the real-world orientation.
            frame = cv2.flip(frame, 1)

            frame_number += 1
            if frame_number % SETTINGS.analyze_every_n_frames == 0:
                worker.submit(frame)

            result_id, emotion, confidence, live_label = worker.get_latest()
            if emotion is not None and result_id != last_result_id:
                last_result_id = result_id
                smoother.add_reading(emotion, confidence)

                print(
                    f"[LIVE] id={result_id}, emotion={emotion}, "
                    f"confidence={confidence:.1f}, "
                    f"backend={worker.backend}, "
                    f"readings={len(smoother.buffer)}, "
                    f"time={time.monotonic():.1f}"
                )

            stable_emotion, stable_confidence, changed = smoother.update()
            if changed:
                mood_result = engine.process_mood(
                    stable_emotion,
                    stable_confidence,
                    worker.backend,
                )
                mood = mood_result["mood"]

                firebase.update_mood(
                    mood["emotion"],
                    mood["confidence"],
                    mood["backend"],
                )
                music_player.play_for_emotion(mood["emotion"])
                
                print(
                    f"[MOOD] Stable: {mood['emotion']} "
                    f"({mood['confidence']:.1f}%, "
                    f"backend={mood['backend']})"
                )

            cv2.putText(
                frame,
                f"Live: {live_label}",
                (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )
            cv2.putText(
                frame,
                f"Stable (4s): {stable_emotion or '...'}",
                (10, 58),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 200, 255),
                2,
            )
            cv2.imshow("Smart Elderly Care - Mood Detection", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:   
        music_player.close()
        worker.stop()
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run()
