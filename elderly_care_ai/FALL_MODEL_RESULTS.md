# Fall Detection Model — Training Results

## Dataset

- Dataset: Smartphone Human Fall Dataset from the user-provided Kaggle archive.
- Training records: 1,428 (614 Fall, 814 No Fall).
- Test records: 356 (153 Fall, 203 No Fall).
- Missing values: 0.
- Duplicate feature rows in the training set: 0.
- Duplicate feature rows in the test set: 0.
- Exact feature-row overlap between training and test sets: 0.
- Target: `fall` (1 = Fall, 0 = No Fall).
- The activity-name field `label` and the exported index `Unnamed: 0` were not
  used as features.

## Method

A Random Forest binary classifier was trained using nine numeric motion
features. Hyperparameters were selected through 5-fold cross-validation on the
training set using Fall F1-score. The supplied test set was kept separate and
used only for the final evaluation.

The trained features are:

1. `acc_max`
2. `gyro_max`
3. `acc_kurtosis`
4. `gyro_kurtosis`
5. `lin_max`
6. `acc_skewness`
7. `gyro_skewness`
8. `post_gyro_max`
9. `post_lin_max`

## Final test results

| Metric | Result |
|---|---:|
| Accuracy | 96.91% |
| Fall precision | 94.38% |
| Fall recall/sensitivity | 98.69% |
| Fall F1-score | 96.49% |
| ROC-AUC | 99.59% |
| PR-AUC (Average Precision) | 99.43% |

Confusion-matrix counts:

| Actual class | Predicted No Fall | Predicted Fall |
|---|---:|---:|
| No Fall | 194 | 9 |
| Fall | 2 | 151 |

The model correctly detected 151 of the 153 fall records in the held-out test
set. It missed 2 fall records and produced 9 false fall alerts. For this
early-warning prototype, Fall recall is emphasized because missing a possible
fall is more serious than requesting an unnecessary caregiver check.

## Most important features

The top Random Forest feature importances were:

1. `post_lin_max` — 34.67%
2. `post_gyro_max` — 19.99%
3. `acc_skewness` — 15.83%
4. `acc_kurtosis` — 11.77%

## Model limitations

- The dataset was generated from smartphone motion data, while the proposed
  hardware uses an MPU6050. Live data must use equivalent units, preprocessing,
  window timing, and feature definitions.
- This model classifies extracted motion windows; it does not directly accept a
  single raw accelerometer reading.
- The result is suitable for a student prototype, not as proof of medical-grade
  safety or diagnosis.

