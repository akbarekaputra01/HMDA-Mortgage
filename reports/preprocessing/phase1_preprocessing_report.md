# Phase 1 Preprocessing Report

## Project
HMDA Mortgage 2022 - Data Understanding and Preprocessing

## Phase Goal
Produce a clean, analysis-ready dataset and document every preprocessing decision with justification. This phase establishes the factual foundation for subsequent mining steps.

## Dataset Summary
- Raw file: `D:\Projects\DM\HMDA Mortgage\data\raw\snapshot-national-loan-level-dataset\loan_application_records_lar\2022_public_lar.csv`
- Sample file: `D:\Projects\DM\HMDA Mortgage\data\sample\hmda_2022_sample_100k.csv`
- Sample rows: 100,000
- Sample columns: 99
- Clean rows: 99,994
- Clean columns: 201
- Duplicate rows removed: 6

## Cleaning Decisions
- The original full HMDA file was not directly used for mining; a reproducible 100,000-record random sample was created first.
- All columns were initially read as string to prevent HMDA code fields and location identifiers from being corrupted.
- `NA`, `Exempt`, blank values, `8888`, and `9999` were audited separately because they may have different meanings in HMDA.
- Numeric mixed columns were converted only after cleaning nonnumeric tokens.
- Missing numeric values were imputed using median values.
- Missing indicator columns were created using suffix `_was_missing`.
- FIPS and tract identifiers were preserved as string/categorical fields.
- Sensitive demographic attributes were retained for EDA/fairness-oriented analysis.
- Sensitive demographic attributes were excluded from the non-sensitive model-ready dataset for classification.

## Transformation Decisions
- Z-score normalization was created for clustering and anomaly detection.
- Min-max normalization was created for dashboard and modeling convenience.
- Quantile binning was created for selected continuous variables for Association Rule Mining.

## Feature Selection
- Pearson correlation was computed between numeric features and `target_denied`.
- Entropy-based information gain was computed between categorical/binned features and `target_denied`.

## Generated Files
- attribute_audit: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_attribute_audit.csv`
- missing_report: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_missing_report.csv`
- outlier_report: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_outlier_report.csv`
- correlation_report: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_numeric_target_correlation.csv`
- information_gain_report: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_information_gain_entropy.csv`
- preprocessing_report: `D:\Projects\DM\HMDA Mortgage\reports\preprocessing\phase1_preprocessing_report.md`
- clean analysis-ready dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_clean_phase1.csv`
- non-sensitive model-ready dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_model_ready_non_sensitive_phase1.csv`

## Notes for Next Phases
- Use `hmda_2022_clean_phase1.csv` for EDA, clustering, ARM, anomaly detection, and visualization.
- Use `hmda_2022_model_ready_non_sensitive_phase1.csv` only if classification is required.
- For Association Rule Mining, prioritize binned variables such as `income_bin`, `loan_amount_bin`, and `property_value_bin`.
- For K-Means or DBSCAN, prioritize normalized numeric columns with suffix `_zscore` or `_minmax`.