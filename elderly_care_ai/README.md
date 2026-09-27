# AI & IoT Smart Elderly Care — AI Module

This is the clean AI starter extracted and adapted from the earlier Smart Mood
Detection project. The hardware build is intentionally outside this folder.

## Current status

- Mood detection: ready for local camera testing.
- Stable mood rule: a confidence-weighted emotion must remain stable for four
  seconds before it is uploaded.
- Firebase: safe Admin SDK adapter with local-only fallback.
- Fall detection: trained Random Forest model with saved evaluation evidence.
- Health anomaly detection: will be implemented after the hardware team confirms
  the available health fields and sampling rate.

This is a student prototype for monitoring and early warnings. It is not a
medical device and must not be presented as a diagnosis system.

## Reused from the previous project

- OpenCV webcam loop.
- DeepFace pretrained facial-emotion analysis.
- RetinaFace first, OpenCV fallback face detection.
- Background inference worker.
- Four-second emotion stabilization logic.
- Firebase result-writing pattern and unit-test approach.

Music playback, DHT/LDR/sound hardware code, old credentials, the old virtual
environment, compiled cache files, and large audio files were not copied.

## Setup on Windows

```powershell
py -m venv .venv
.\.venv\Scripts\activate
py -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Run the mood module:

```powershell
py run_mood_detection.py
```

Press `q` to close the camera. The displayed camera is not mirrored.

## Train the fall model

For one labelled CSV, place it inside `data/`, then run:

```powershell
py train_fall_model.py --data data\YOUR_DATASET.csv
```

The uploaded notebook uses the **Smartphone Human Fall Dataset**, which has
separate `Train.csv` and `Test.csv` files. After downloading those two files,
run:

```powershell
py train_fall_model.py `
  --train-data data\Train.csv `
  --test-data data\Test.csv `
  --label-column fall `
  --tune
```

This version tunes only through cross-validation on `Train.csv`. `Test.csv` is
used once for the final unbiased evaluation. The old notebook's later loop,
which repeatedly selected settings using test accuracy, is intentionally not
used.

If the script cannot detect the label or subject column:

```powershell
py train_fall_model.py --data data\YOUR_DATASET.csv `
  --label-column YOUR_LABEL_COLUMN `
  --group-column YOUR_SUBJECT_COLUMN
```

Generated evidence for the report/presentation:

- `models/fall_model.joblib`
- `outputs/fall_training/metrics.json`
- `outputs/fall_training/classification_report.txt`
- `outputs/fall_training/confusion_matrix.png`
- `outputs/fall_training/feature_importance.csv`
- `outputs/fall_training/mutual_information.csv`
- `outputs/fall_training/test_predictions.csv`

The completed training run achieved 96.91% test accuracy and 98.69% Fall
recall. See `FALL_MODEL_RESULTS.md` for the full explanation and confusion
matrix counts.

Run the trained model on another compatible feature CSV:

```powershell
py predict_fall_csv.py --input data\FEATURE_ROWS.csv
```

The dataset must contain numeric accelerometer/gyroscope features or extracted
window features plus a Fall/No-Fall label. If it contains raw time-series rows,
the next step is to add dataset-specific windowing after the CSV is inspected.

## Simulate and monitor Firebase movement data

Publish model-compatible fall and no-fall windows to Firebase and process them:

```powershell
py simulate_fall_monitor.py
```

Continuously monitor the latest movement window written by hardware:

```powershell
py run_fall_detection.py
```

## Predict directly from raw MPU6050 data

The raw input must contain `ax,ay,az,gx,gy,gz`. Acceleration defaults to `g`
and gyroscope readings to degrees/second. For a CSV recording:

```powershell
py run_mpu6050_fall_detection.py --csv data\mpu6050_raw.csv `
  --window-size 100 --step 50 --acc-unit g
```

For live Arduino serial output (`ax,ay,az,gx,gy,gz`, one sample per line):

```powershell
py run_mpu6050_fall_detection.py --port COM3 --baud-rate 115200 `
  --window-size 100 --step 50 --acc-unit g
```

Use a window size matching the sampling rate (for example, 100 samples is two
seconds at 50 Hz). The current saved model was trained on smartphone-derived
window features. Raw MPU6050 feature extraction is compatible by name, but the
model should be retrained with labelled MPU6050 windows before treating its
accuracy as reliable.

Publish sample heart-rate, SpO2, temperature, humidity, health, and mood data:

```powershell
py simulate_sensor_data.py
```

Continuously monitor Arduino vital readings from Firebase:

```powershell
py run_vitals_monitor.py
```

Hardware (or its edge firmware) must publish a `features` object containing
`acc_max`, `gyro_max`, `acc_kurtosis`, `gyro_kurtosis`, `lin_max`,
`acc_skewness`, `gyro_skewness`, `post_gyro_max`, and `post_lin_max` under
`elderly/{elderly_id}/sensors/movement/windows`. The same record is mirrored at
`elderly/{elderly_id}/sensors/movement/latest`. These are window statistics,
not individual MPU6050 samples; their units and windowing must match training.

## Firebase contract for the group

The AI module writes:

```text
elderly/{elderly_id}/ai/mood
elderly/{elderly_id}/ai/fall
elderly/{elderly_id}/alerts/{alert_id}
elderly/{elderly_id}/history/mood/{record_id}
```

The hardware member should publish movement data under one agreed location,
for example:

```json
{
  "elderly/elderly_001/sensors/movement": {
    "acc_x": 0.12,
    "acc_y": 0.25,
    "acc_z": 9.70,
    "gyro_x": 1.2,
    "gyro_y": 0.4,
    "gyro_z": 0.8,
    "timestamp": "UTC ISO-8601"
  }
}
```

The exact live feature names must match the features used to train the model.
Before integration, confirm the MPU6050 sampling frequency, measurement units,
window duration, and Firebase path with the hardware member.

## Security

Do not commit `.env`, Wi-Fi passwords, or Firebase service-account JSON files.
Firebase Realtime Database rules must require authenticated access before the
final demonstration.
