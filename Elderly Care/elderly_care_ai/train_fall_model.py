import argparse
import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import mutual_info_classif
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    average_precision_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit, RandomizedSearchCV, train_test_split
from sklearn.pipeline import Pipeline


# This dataset uses `fall` as the binary target and `label` as an activity name.
LABEL_CANDIDATES = ("fall", "is_fall", "target", "class", "activity", "label")
GROUP_CANDIDATES = ("subject", "subject_id", "person", "person_id", "user_id")
ACTIVITY_CANDIDATES = ("label", "activity", "activity_name")


def load_csv(path: str | Path) -> pd.DataFrame:
    frame = pd.read_csv(path)
    index_columns = [
        column for column in frame.columns if str(column).lower().startswith("unnamed:")
    ]
    return frame.drop(columns=index_columns, errors="ignore")


def choose_column(columns, requested, candidates, kind, required=True):
    if requested:
        if requested not in columns:
            raise ValueError(f"Requested {kind} column '{requested}' was not found.")
        return requested
    lower_map = {str(column).lower(): column for column in columns}
    for candidate in candidates:
        if candidate in lower_map:
            return lower_map[candidate]
    if required:
        raise ValueError(
            f"Could not detect the {kind} column. Use --{kind.replace('_', '-')} COLUMN. "
            f"Available columns: {list(columns)}"
        )
    return None


def normalize_labels(series: pd.Series) -> pd.Series:
    if pd.api.types.is_bool_dtype(series):
        return series.astype(int)

    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().all() and set(numeric.unique()).issubset({0, 1}):
        return numeric.astype(int)

    text = series.astype(str).str.strip().str.lower()
    no_fall = text.str.contains(r"non[-_ ]?fall|no[-_ ]?fall|not fall", regex=True)
    fall = text.str.contains("fall", regex=False) & ~no_fall
    labels = fall.astype(int)
    if labels.nunique() < 2:
        raise ValueError(
            "Labels could not be converted to Fall/No Fall. Check the label values."
        )
    return labels


def numeric_features(frame, excluded, drop_features=()):
    excluded = set(excluded) | set(drop_features)
    features = frame.drop(columns=list(excluded), errors="ignore").select_dtypes(
        include="number"
    )
    if features.empty:
        raise ValueError("No numeric sensor feature columns were found.")
    return features


def split_data(x, y, groups=None):
    if groups is not None and groups.nunique() >= 3:
        splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        train_index, test_index = next(splitter.split(x, y, groups=groups))
        return (
            x.iloc[train_index],
            x.iloc[test_index],
            y.iloc[train_index],
            y.iloc[test_index],
            "group",
        )
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )
    return x_train, x_test, y_train, y_test, "stratified_random"


def build_pipeline(feature_names):
    preprocessor = ColumnTransformer(
        [
            (
                "numeric",
                Pipeline([("imputer", SimpleImputer(strategy="median"))]),
                list(feature_names),
            )
        ],
        remainder="drop",
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=300,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def tune_pipeline(pipeline, x_train, y_train, iterations):
    search_space = {
        "classifier__n_estimators": [200, 400, 600, 800, 1000],
        "classifier__max_features": ["sqrt", "log2", None],
        "classifier__max_depth": [None, 10, 30, 50, 70],
        "classifier__min_samples_split": [2, 5, 9, 12],
        "classifier__min_samples_leaf": [1, 3, 5, 7],
        "classifier__bootstrap": [True, False],
    }
    search = RandomizedSearchCV(
        estimator=pipeline,
        param_distributions=search_space,
        n_iter=iterations,
        scoring="f1",
        cv=5,
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )
    search.fit(x_train, y_train)
    return search.best_estimator_, search.best_params_, float(search.best_score_)


def main():
    parser = argparse.ArgumentParser(description="Train a Fall/No-Fall classifier.")
    parser.add_argument("--data", help="One CSV that will be safely split")
    parser.add_argument("--train-data", help="Official training CSV")
    parser.add_argument("--test-data", help="Official test CSV")
    parser.add_argument("--label-column", help="Binary target; auto-detected")
    parser.add_argument("--group-column", help="Subject/person ID for a group split")
    parser.add_argument(
        "--drop-feature",
        action="append",
        default=[],
        help="Numeric feature to exclude; may be repeated",
    )
    parser.add_argument(
        "--tune",
        action="store_true",
        help="Tune using training cross-validation; test data remains untouched",
    )
    parser.add_argument("--tuning-iterations", type=int, default=30)
    parser.add_argument("--output-dir", default="outputs/fall_training")
    parser.add_argument("--model-path", default="models/fall_model.joblib")
    args = parser.parse_args()

    if bool(args.data) == bool(args.train_data):
        parser.error("Use either --data OR --train-data (not both).")
    if args.test_data and not args.train_data:
        parser.error("--test-data requires --train-data.")

    output_dir = Path(args.output_dir)
    model_path = Path(args.model_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path.parent.mkdir(parents=True, exist_ok=True)

    train_frame = load_csv(args.train_data or args.data)
    label_column = choose_column(
        train_frame.columns, args.label_column, LABEL_CANDIDATES, "label_column"
    )
    activity_column = choose_column(
        train_frame.columns, None, ACTIVITY_CANDIDATES, "activity_column", required=False
    )
    if activity_column == label_column:
        activity_column = None

    group_column = args.group_column or choose_column(
        train_frame.columns, None, GROUP_CANDIDATES, "group_column", required=False
    )
    excluded = [label_column]
    if activity_column:
        excluded.append(activity_column)
    if group_column:
        excluded.append(group_column)

    x_all = numeric_features(train_frame, excluded, args.drop_feature)
    y_all = normalize_labels(train_frame[label_column])

    if args.test_data:
        test_frame = load_csv(args.test_data)
        if label_column not in test_frame.columns:
            raise ValueError(f"Test data does not contain target '{label_column}'.")
        x_train, y_train = x_all, y_all
        x_test = numeric_features(test_frame, excluded, args.drop_feature)
        missing = [column for column in x_train.columns if column not in x_test.columns]
        if missing:
            raise ValueError(f"Test data is missing training features: {missing}")
        x_test = x_test[list(x_train.columns)]
        y_test = normalize_labels(test_frame[label_column])
        split_method = "provided_train_test"
    else:
        groups = train_frame[group_column] if group_column else None
        x_train, x_test, y_train, y_test, split_method = split_data(
            x_all, y_all, groups
        )

    pipeline = build_pipeline(x_train.columns)
    best_params = None
    cv_f1 = None
    if args.tune:
        pipeline, best_params, cv_f1 = tune_pipeline(
            pipeline, x_train, y_train, args.tuning_iterations
        )
    else:
        pipeline.fit(x_train, y_train)

    predictions = pipeline.predict(x_test)
    probabilities = pipeline.predict_proba(x_test)[:, 1]
    metrics = {
        "training_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "fall_rows_training": int(y_train.sum()),
        "fall_rows_test": int(y_test.sum()),
        "features": list(x_train.columns),
        "label_column": str(label_column),
        "activity_column": str(activity_column) if activity_column else None,
        "group_column": str(group_column) if group_column else None,
        "split_method": split_method,
        "hyperparameter_tuning": bool(args.tune),
        "cross_validation_f1": cv_f1,
        "accuracy": accuracy_score(y_test, predictions),
        "precision_fall": precision_score(y_test, predictions, zero_division=0),
        "recall_fall": recall_score(y_test, predictions, zero_division=0),
        "f1_fall": f1_score(y_test, predictions, zero_division=0),
        "roc_auc": roc_auc_score(y_test, probabilities),
        "pr_auc": average_precision_score(y_test, probabilities),
    }
    (output_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    (output_dir / "best_parameters.json").write_text(
        json.dumps(best_params or {}, indent=2), encoding="utf-8"
    )
    (output_dir / "classification_report.txt").write_text(
        classification_report(
            y_test, predictions, target_names=["No Fall", "Fall"], zero_division=0
        ),
        encoding="utf-8",
    )
    pd.DataFrame(
        {
            "actual_fall": y_test.to_numpy(),
            "predicted_fall": predictions,
            "fall_probability": probabilities,
        }
    ).to_csv(output_dir / "test_predictions.csv", index=False)

    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
    ConfusionMatrixDisplay(matrix, display_labels=["No Fall", "Fall"]).plot(
        cmap="Blues", values_format="d"
    )
    plt.title("Fall Detection Confusion Matrix")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=180)
    plt.close()

    classifier = pipeline.named_steps["classifier"]
    pd.DataFrame(
        {"feature": list(x_train.columns), "importance": classifier.feature_importances_}
    ).sort_values("importance", ascending=False).to_csv(
        output_dir / "feature_importance.csv", index=False
    )
    imputed_train = pipeline.named_steps["preprocess"].transform(x_train)
    mi_scores = mutual_info_classif(imputed_train, y_train, random_state=42)
    pd.DataFrame(
        {"feature": list(x_train.columns), "mutual_information": mi_scores}
    ).sort_values("mutual_information", ascending=False).to_csv(
        output_dir / "mutual_information.csv", index=False
    )

    joblib.dump(
        {
            "pipeline": pipeline,
            "feature_names": list(x_train.columns),
            "metrics": metrics,
        },
        model_path,
    )
    print(json.dumps(metrics, indent=2))
    print(f"Model saved to: {model_path}")


if __name__ == "__main__":
    main()

