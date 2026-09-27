import argparse
from pathlib import Path

import joblib
import pandas as pd


def main():
    parser = argparse.ArgumentParser(
        description="Run the trained fall model on extracted sensor features."
    )
    parser.add_argument("--input", required=True, help="Input CSV with model features")
    parser.add_argument("--model", default="models/fall_model.joblib")
    parser.add_argument("--output", default="outputs/fall_predictions.csv")
    args = parser.parse_args()

    bundle = joblib.load(args.model)
    model = bundle["pipeline"]
    feature_names = bundle["feature_names"]
    frame = pd.read_csv(args.input)

    missing = [name for name in feature_names if name not in frame.columns]
    if missing:
        raise ValueError(f"Input CSV is missing model features: {missing}")

    prediction = model.predict(frame[feature_names]).astype(int)
    probability = model.predict_proba(frame[feature_names])[:, 1]
    result = frame.copy()
    result["predicted_fall"] = prediction
    result["fall_probability"] = probability.round(4)
    result["predicted_status"] = result["predicted_fall"].map(
        {0: "No Fall", 1: "Possible Fall"}
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_path, index=False)
    print(result[["predicted_status", "fall_probability"]].to_string(index=False))
    print(f"Predictions saved to: {output_path}")


if __name__ == "__main__":
    main()

