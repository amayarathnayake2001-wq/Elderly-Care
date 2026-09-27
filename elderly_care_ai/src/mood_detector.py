import threading
import time


class MoodAnalysisWorker:
    """Runs DeepFace off the camera thread so the preview remains responsive."""

    def __init__(self, detector_backends=("retinaface", "opencv")):
        self.detector_backends = detector_backends
        self.backend = detector_backends[0]
        self._lock = threading.Lock()
        self._latest_frame = None
        self._latest_result = (0, None, 0.0, "warming up...")
        self._result_id = 0
        self._busy = False
        self._stop = False
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def submit(self, frame) -> None:
        if self._busy:
            return
        with self._lock:
            self._latest_frame = frame.copy()

    def get_latest(self):
        with self._lock:
            return self._latest_result

    def _analyze(self, deepface, frame):
        last_error = None
        for backend in self.detector_backends:
            try:
                results = deepface.analyze(
                    img_path=frame,
                    actions=["emotion"],
                    detector_backend=backend,
                    enforce_detection=False,
                    silent=True,
                )
                self.backend = backend
                return results
            except Exception as exc:
                last_error = exc
        raise RuntimeError(f"No face detector backend succeeded: {last_error}")

    def _loop(self) -> None:
        from deepface import DeepFace

        while not self._stop:
            with self._lock:
                frame = self._latest_frame
                self._latest_frame = None
            if frame is None:
                time.sleep(0.01)
                continue

            self._busy = True
            try:
                results = self._analyze(DeepFace, frame)
                result = results[0] if isinstance(results, list) else results
                emotion = result["dominant_emotion"]
                confidence = float(result["emotion"][emotion])
                label = f"{emotion} ({confidence:.0f}%)"
                with self._lock:
                    self._result_id += 1
                    self._latest_result = (
                        self._result_id,
                        emotion,
                        confidence,
                        label,
                    )
            except Exception as exc:
                with self._lock:
                    self._result_id += 1
                    self._latest_result = (
                        self._result_id,
                        None,
                        0.0,
                        f"detection error: {exc}",
                    )
            finally:
                self._busy = False

    def stop(self) -> None:
        self._stop = True
        self._thread.join(timeout=3.0)

