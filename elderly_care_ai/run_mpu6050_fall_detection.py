import argparse
import csv
import sys
from pathlib import Path

from src.config import SETTINGS
from src.fall_model import FallModel
from src.firebase_client import FirebaseClient
from src.mpu6050_features import MPU6050Window, RAW_FIELDS, extract_mpu6050_features


def csv_samples(stream):
    reader = csv.DictReader(stream)
    missing = [name for name in RAW_FIELDS if name not in (reader.fieldnames or [])]
    if missing:
        raise ValueError(f"CSV header is missing: {', '.join(missing)}")
    for row in reader:
        yield {name: float(row[name]) for name in RAW_FIELDS}


def serial_samples(port: str, baud_rate: int):
    try:
        import serial
    except ImportError as exc:
        raise RuntimeError("Install pyserial first: pip install pyserial") from exc

    print(f"[MPU6050] Reading {port} at {baud_rate} baud. Ctrl+C to stop.")
    with serial.Serial(port, baud_rate, timeout=2) as connection:
        while True:
            line = connection.readline().decode("utf-8", errors="ignore").strip()
            if not line or line.lower().startswith("ax"):
                continue
            values = [part.strip() for part in line.split(",")]
            if len(values) != 6:
                print(f"[SKIP] Expected 6 comma-separated values: {line}")
                continue
            try:
                yield dict(zip(RAW_FIELDS, map(float, values)))
            except ValueError:
                print(f"[SKIP] Non-numeric sensor line: {line}")


def run(
    samples,
    model_path: Path,
    window_size: int,
    step: int,
    unit: str,
    firebase=None,
):
    model = FallModel(model_path)
    window = MPU6050Window(window_size, step)
    count = 0
    for sample in samples:
        current = window.add(sample)
        if current is None:
            continue
        count += 1
        features = extract_mpu6050_features(current, unit)
        label, probability = model.predict(features)
        if firebase is not None:
            uploaded = firebase.update_fall_prediction(
                label,
                probability,
                source="mpu6050",
            )
            firebase_status = "uploaded" if uploaded else "not uploaded"
        else:
            firebase_status = "disabled"
        print(
            f"[WINDOW {count}] result={label}, "
            f"fall_probability={probability:.4f}, firebase={firebase_status}"
        )
    if count == 0:
        raise RuntimeError(f"Not enough samples; need at least {window_size}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Predict falls from raw MPU6050 ax,ay,az,gx,gy,gz samples."
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--csv", type=Path, help="Raw MPU6050 CSV file, or - for stdin")
    source.add_argument("--port", help="Serial port, for example COM3")
    parser.add_argument("--baud-rate", type=int, default=115200)
    parser.add_argument("--window-size", type=int, default=100)
    parser.add_argument("--step", type=int, default=50)
    parser.add_argument("--acc-unit", choices=("g", "m/s2"), default="g")
    parser.add_argument("--model", type=Path, default=Path("models/fall_model.joblib"))
    parser.add_argument(
        "--no-firebase",
        action="store_true",
        help="Run predictions locally without uploading them to Firebase.",
    )
    args = parser.parse_args()

    try:
        firebase = None
        if not args.no_firebase:
            firebase = FirebaseClient(
                SETTINGS.firebase_credentials_path,
                SETTINGS.firebase_database_url,
                SETTINGS.elderly_id,
            )
            if not firebase.ready:
                raise RuntimeError(
                    "Firebase is not configured. Check FIREBASE_CREDENTIALS_PATH "
                    "and FIREBASE_DATABASE_URL, or use --no-firebase."
                )

        if args.port:
            rows = serial_samples(args.port, args.baud_rate)
            run(rows, args.model, args.window_size, args.step, args.acc_unit, firebase)
        elif str(args.csv) == "-":
            run(
                csv_samples(sys.stdin),
                args.model,
                args.window_size,
                args.step,
                args.acc_unit,
                firebase,
            )
        else:
            with args.csv.open(newline="", encoding="utf-8-sig") as handle:
                run(
                    csv_samples(handle),
                    args.model,
                    args.window_size,
                    args.step,
                    args.acc_unit,
                    firebase,
                )
    except (KeyboardInterrupt, RuntimeError, ValueError) as exc:
        if isinstance(exc, KeyboardInterrupt):
            print("\n[STOP] MPU6050 monitoring stopped.")
        else:
            parser.error(str(exc))
