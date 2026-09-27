import random
from pathlib import Path


class MoodMusicPlayer:
    """Plays local music without blocking the camera processing loop."""

    EMOTION_TO_CATEGORY = {
        "happy": "happy",
        "sad": "sad",
        "angry": "angry",
        "disgust": "angry",
        "fear": "stressed",
        "surprise": "stressed",
        "neutral": None,
    }

    SUPPORTED_FORMATS = {".mp3", ".wav", ".ogg"}

    def __init__(
        self,
        music_root: str | Path,
        volume: float = 0.5,
    ):
        self.music_root = Path(music_root)
        self.volume = max(0.0, min(1.0, float(volume)))
        self.current_category = None
        self.current_track = None
        self.enabled = False
        self._pygame = None

        try:
            import pygame

            pygame.mixer.init()
            pygame.mixer.music.set_volume(self.volume)
            self._pygame = pygame
            self.enabled = True
            print("[MUSIC] Audio player ready.")
        except Exception as exc:
            print(f"[MUSIC] Audio disabled: {exc}")

    def _tracks_for_category(self, category: str) -> list[Path]:
        folder = self.music_root / category
        if not folder.exists():
            return []

        return sorted(
            path
            for path in folder.iterdir()
            if path.is_file()
            and path.suffix.lower() in self.SUPPORTED_FORMATS
        )

    def play_for_emotion(self, emotion: str) -> Path | None:
        normalized_emotion = emotion.strip().lower()
        category = self.EMOTION_TO_CATEGORY.get(normalized_emotion)

        if category is None:
            self.stop()
            print(
                f"[MUSIC] No playback configured for "
                f"emotion={normalized_emotion}"
            )
            return None

        if not self.enabled:
            return None

        if (
            category == self.current_category
            and self._pygame.mixer.music.get_busy()
        ):
            return self.current_track

        tracks = self._tracks_for_category(category)
        if not tracks:
            print(f"[MUSIC] No tracks found for category={category}")
            return None

        available_tracks = [
            track for track in tracks
            if track != self.current_track
        ]
        if not available_tracks:
            available_tracks = tracks

        selected_track = random.choice(available_tracks)

        try:
            self._pygame.mixer.music.fadeout(800)
            self._pygame.mixer.music.load(str(selected_track))
            self._pygame.mixer.music.play(loops=-1, fade_ms=800)

            self.current_category = category
            self.current_track = selected_track

            print(
                f"[MUSIC] Playing for {normalized_emotion}: "
                f"{selected_track.name}"
            )
            return selected_track
        except Exception as exc:
            print(f"[MUSIC] Playback failed: {exc}")
            return None

    def stop(self) -> None:
        if self.enabled and self._pygame.mixer.music.get_busy():
            self._pygame.mixer.music.fadeout(800)

        self.current_category = None
        self.current_track = None

    def close(self) -> None:
        if self.enabled:
            self.stop()
            self._pygame.mixer.quit()
            self.enabled = False