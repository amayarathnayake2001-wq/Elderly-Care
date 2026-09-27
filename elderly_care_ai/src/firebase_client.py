from datetime import datetime, timezone


class FirebaseClient:
    """Firebase adapter with safe local-only and write-failure handling."""

    def __init__(
        self,
        credentials_path: str,
        database_url: str,
        elderly_id: str,
    ):
        self.elderly_id = elderly_id
        self._db = None

        if not credentials_path or not database_url:
            print(
                "[FIREBASE] Local-only mode: "
                "credentials/database URL not configured."
            )
            return

        try:
            import firebase_admin
            from firebase_admin import credentials, db

            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app(
                    credentials.Certificate(credentials_path),
                    {"databaseURL": database_url},
                )

            self._db = db
            print("[FIREBASE] Connected.")
        except Exception as exc:
            print(f"[FIREBASE] Connection failed; local mode: {exc}")

    @property
    def ready(self) -> bool:
        return self._db is not None

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _safe_set(self, path: str, payload: dict) -> bool:
        if not self.ready:
            return False

        try:
            self._db.reference(path).set(payload)
            return True
        except Exception as exc:
            print(f"[FIREBASE] Set failed at {path}: {exc}")
            return False

    def _safe_push(self, path: str, payload: dict) -> bool:
        if not self.ready:
            return False

        try:
            self._db.reference(path).push(payload)
            return True
        except Exception as exc:
            print(f"[FIREBASE] Push failed at {path}: {exc}")
            return False

    def publish_sensor_reading(
        self,
        heart_rate_bpm: float,
        spo2_pct: float,
        temperature_c: float,
        humidity_pct: float,
        source: str = "hardware",
    ) -> bool:
        """Write the latest vital/environment reading and append its history."""
        payload = {
            "heart_rate_bpm": float(heart_rate_bpm),
            "spo2_pct": float(spo2_pct),
            "temperature_c": float(temperature_c),
            "humidity_pct": float(humidity_pct),
            "source": source,
            "timestamp": self._timestamp(),
        }

        if not self.ready:
            print(f"[LOCAL] sensor_reading={payload}")
            return False

        latest_ok = self._safe_set(
            f"elderly/{self.elderly_id}/sensors/vitals/latest",
            payload,
        )
        history_ok = self._safe_push(
            f"elderly/{self.elderly_id}/sensors/vitals/history",
            payload,
        )
        return latest_ok and history_ok

    def get_latest_sensor_reading(self):
        """Read the latest Arduino vital/environment sensor payload."""
        if not self.ready:
            return None

        path = f"elderly/{self.elderly_id}/sensors/vitals/latest"
        try:
            return self._db.reference(path).get()
        except Exception as exc:
            print(f"[FIREBASE] Sensor read failed at {path}: {exc}")
            return None

    def publish_movement_window(self, features: dict, source: str = "hardware"):
        """Publish one model-ready movement window and return its Firebase key."""
        payload = {
            "features": {name: float(value) for name, value in features.items()},
            "source": source,
            "timestamp": self._timestamp(),
        }
        path = f"elderly/{self.elderly_id}/sensors/movement/windows"

        if not self.ready:
            print(f"[LOCAL] movement_window={payload}")
            return None

        try:
            reference = self._db.reference(path).push(payload)
            self._db.reference(
                f"elderly/{self.elderly_id}/sensors/movement/latest"
            ).set({"window_id": reference.key, **payload})
            return reference.key
        except Exception as exc:
            print(f"[FIREBASE] Movement publish failed at {path}: {exc}")
            return None

    def get_movement_window(self, window_id: str | None = None):
        """Read a movement window by key, or read the latest window."""
        if not self.ready:
            return None

        if window_id:
            path = (
                f"elderly/{self.elderly_id}/sensors/movement/windows/"
                f"{window_id}"
            )
        else:
            path = f"elderly/{self.elderly_id}/sensors/movement/latest"

        try:
            return self._db.reference(path).get()
        except Exception as exc:
            print(f"[FIREBASE] Movement read failed at {path}: {exc}")
            return None

    def update_mood(
        self,
        emotion: str,
        confidence: float,
        backend: str = "unknown",
    ) -> bool:
        payload = {
            "emotion": emotion,
            "confidence": round(confidence, 1),
            "backend": backend,
            "timestamp": self._timestamp(),
            "model": "DeepFace pretrained emotion model",
        }

        if not self.ready:
            print(f"[LOCAL] mood={payload}")
            return False

        latest_ok = self._safe_set(
            f"elderly/{self.elderly_id}/ai/mood",
            payload,
        )
        history_ok = self._safe_push(
            f"elderly/{self.elderly_id}/history/mood",
            payload,
        )
        return latest_ok and history_ok

    def update_health_result(self, result: dict) -> bool:
        health = result["health"]
        alert = result.get("alert")

        payload = {
            "status": health["status"],
            "risk_score": health["risk_score"],
            "reasons": health["reasons"],
            "event_codes": health["event_codes"],
            "requires_alert": health["requires_alert"],
            "timestamp": result["timestamp"],
        }

        if not self.ready:
            print(f"[LOCAL] health={payload}")

            if alert is not None:
                self.create_alert(
                    alert["type"],
                    alert["severity"],
                    {
                        "message": alert["message"],
                        "health": payload,
                    },
                )
            return False

        latest_ok = self._safe_set(
            f"elderly/{self.elderly_id}/ai/health",
            payload,
        )
        history_ok = self._safe_push(
            f"elderly/{self.elderly_id}/history/health",
            payload,
        )

        alert_ok = True
        if alert is not None:
            alert_ok = self.create_alert(
                alert["type"],
                alert["severity"],
                {
                    "message": alert["message"],
                    "health": payload,
                },
            )

        return latest_ok and history_ok and alert_ok

    def update_fall_prediction(
        self,
        prediction: str,
        probability: float,
        source: str = "fall_model",
    ) -> bool:
        normalized_prediction = prediction.strip().lower()
        payload = {
            "prediction": normalized_prediction,
            "fall_detected": normalized_prediction == "fall",
            "fall_probability": round(probability, 4),
            "source": source,
            "timestamp": self._timestamp(),
        }

        if not self.ready:
            print(f"[LOCAL] fall={payload}")
            return False

        latest_ok = self._safe_set(
            f"elderly/{self.elderly_id}/ai/fall",
            payload,
        )
        history_ok = self._safe_push(
            f"elderly/{self.elderly_id}/history/fall",
            payload,
        )
        return latest_ok and history_ok

    def create_alert(
        self,
        alert_type: str,
        severity: str,
        details: dict,
    ) -> bool:
        payload = {
            "type": alert_type,
            "severity": severity,
            "status": "new",
            "details": details,
            "timestamp": self._timestamp(),
        }

        if not self.ready:
            print(f"[LOCAL] alert={payload}")
            return False

        return self._safe_push(
            f"elderly/{self.elderly_id}/alerts",
            payload,
        )
