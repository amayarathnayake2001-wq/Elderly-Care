from pathlib import Path

import joblib
import pandas as pd


class FallModel:
    def __init__(self, model_path: str | Path):
        bundle = joblib.load(model_path)
        self.pipeline = bundle["pipeline"]
        self.feature_names = bundle["feature_names"]

    def predict(self, features: dict):
        missing = [name for name in self.feature_names if name not in features]
        if missing:
            raise ValueError(f"Missing fall-model features: {missing}")
        row = pd.DataFrame(
            [[features[name] for name in self.feature_names]],
            columns=self.feature_names,
        )
        prediction = int(self.pipeline.predict(row)[0])
        probability = float(self.pipeline.predict_proba(row)[0, 1])
        return ("fall" if prediction == 1 else "no_fall"), probability

