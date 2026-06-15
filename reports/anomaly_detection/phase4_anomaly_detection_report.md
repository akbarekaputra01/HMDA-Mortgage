# Phase 4 Anomaly and Outlier Detection Report

## Project
HMDA Mortgage 2022 - Anomaly and Outlier Detection

## Phase Goal
Identify records that deviate substantially from the rest of the data and determine whether each deviation represents a data quality issue, an unusual but valid case, or a signal worth escalating.

## Input Dataset
- Input file: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_clustered_phase2.csv`
- Rows: 99,994
- Columns: 205

## Features Used
The anomaly detection feature set focuses on financial, risk, pricing, loan, property, and tract-level attributes.

- `income`
- `debt_to_income_ratio_midpoint`
- `loan_amount`
- `property_value`
- `combined_loan_to_value_ratio`
- `loan_term`
- `interest_rate`
- `rate_spread`
- `total_loan_costs`
- `total_points_and_fees`
- `origination_charges`
- `discount_points`
- `lender_credits`
- `tract_population`
- `tract_minority_population_percent`
- `ffiec_msa_md_median_family_income`
- `tract_to_msa_income_percentage`
- `tract_owner_occupied_units`
- `tract_one_to_four_family_homes`
- `tract_median_age_of_housing_units`

Sensitive demographic attributes were not used as input features for the anomaly model. They may still be analyzed after anomaly labels are created for EDA and fairness-oriented interpretation.

## Methods
### 1. Statistical Outlier Detection
- IQR rule: value below Q1 - 1.5 × IQR or above Q3 + 1.5 × IQR.
- Z-score rule: absolute z-score greater than 3.0.
- Statistical outlier report: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_statistical_outlier_report.csv`

### 2. Isolation Forest
- Isolation Forest was used as a structural anomaly detection method.
- Contamination parameter: 0.02
- Isolation Forest anomalies: 2,000 records (2.00%).
- Isolation Forest report: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_isolation_forest_report.csv`

### 3. Cluster Cross-Reference
- DBSCAN noise labels from Phase 2 were used as cluster-based anomaly evidence when available.
- K-Means distance-to-centroid was recomputed to identify records far from their assigned cluster center.
- Cluster cross-reference file: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_cluster_cross_reference.csv`

### 4. Domain-Specific Anomaly Rules
- Additional flags were created for suspicious values or unusual combinations such as very high CLTV, very high DTI, very high pricing, high loan amount, high property value, and low-income/high-loan combinations.

## Overall Results
- Final flagged anomalies: 31,690
- Final flagged anomaly percentage: 31.69%
- Top anomaly score threshold used for final score evidence: 0.2856

## Anomaly Type Summary
- Multivariate statistical outlier: 20,193 records (63.72% of flagged, 20.19% of all data)
- Potential financial risk signal: 7,556 records (23.84% of flagged, 7.56% of all data)
- Rare but potentially legitimate high-value case: 1,886 records (5.95% of flagged, 1.89% of all data)
- Structural anomaly detected by Isolation Forest: 961 records (3.03% of flagged, 0.96% of all data)
- Far from assigned cluster centroid: 563 records (1.78% of flagged, 0.56% of all data)
- Cluster noise / structurally isolated profile: 457 records (1.44% of flagged, 0.46% of all data)
- Potential data quality issue: 74 records (0.23% of flagged, 0.07% of all data)

## Top Records for Review
The top 200 anomaly records were exported for manual review. Below are the first 10 highest-scored anomalies.

### Review Record Index 57680
- Anomaly score: 0.7796
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 4 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: origination_charges=high_outlier(z=16.55); total_loan_costs=high_outlier(z=12.28); loan_amount=high_outlier(z=4.31); property_value=high_outlier(z=3.90); ffiec_msa_md_median_family_income=high_outlier(z=2.34)
- Business interpretation: This record has anomaly score 0.7796 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 22984
- Anomaly score: 0.7710
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 5 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: very_high_interest_rate_10_plus; top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: interest_rate=high_outlier(z=4.25); rate_spread=high_outlier(z=4.15); loan_amount=high_outlier(z=3.42); ffiec_msa_md_median_family_income=high_outlier(z=3.16); property_value=high_outlier(z=3.10)
- Business interpretation: This record has anomaly score 0.7710 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Application approved but not accepted. K-Means cluster: 2. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 64424
- Anomaly score: 0.7589
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 5 feature(s); identified as DBSCAN noise in Phase 2; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: origination_charges=high_outlier(z=8.72); total_loan_costs=high_outlier(z=7.55); property_value=high_outlier(z=3.49); loan_amount=high_outlier(z=3.32); tract_to_msa_income_percentage=high_outlier(z=3.29)
- Business interpretation: This record has anomaly score 0.7589 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 36955
- Anomaly score: 0.7458
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 4 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: loan_amount=high_outlier(z=6.67); total_loan_costs=high_outlier(z=5.80); tract_to_msa_income_percentage=high_outlier(z=5.76); property_value=high_outlier(z=4.45); interest_rate=low_outlier(z=1.93)
- Business interpretation: This record has anomaly score 0.7458 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 82098
- Anomaly score: 0.7449
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 4 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: lender_credits=high_outlier(z=14.21); loan_amount=high_outlier(z=9.85); property_value=high_outlier(z=8.90); tract_to_msa_income_percentage=high_outlier(z=3.29); interest_rate=low_outlier(z=2.05)
- Business interpretation: This record has anomaly score 0.7449 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 17485
- Anomaly score: 0.7270
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 7 feature(s); Z-score outlier in 3 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: lender_credits=high_outlier(z=26.47); ffiec_msa_md_median_family_income=high_outlier(z=3.20); property_value=high_outlier(z=3.01); loan_amount=high_outlier(z=2.78); debt_to_income_ratio_midpoint=low_outlier(z=2.68)
- Business interpretation: This record has anomaly score 0.7270 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 53296
- Anomaly score: 0.7229
- Type: Rare but potentially legitimate high-value case
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 6 feature(s); far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: origination_charges=high_outlier(z=21.88); total_loan_costs=high_outlier(z=14.72); tract_to_msa_income_percentage=high_outlier(z=4.21); interest_rate=high_outlier(z=4.15); rate_spread=high_outlier(z=3.24)
- Business interpretation: This record has anomaly score 0.7229 and is categorized as 'Rare but potentially legitimate high-value case'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: treat as a rare high-value case rather than automatically removing it.

### Review Record Index 41958
- Anomaly score: 0.7208
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 4 feature(s); Z-score outlier in 4 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: discount_points=high_outlier(z=15.68); origination_charges=high_outlier(z=12.22); total_loan_costs=high_outlier(z=10.18); loan_amount=high_outlier(z=3.32); interest_rate=low_outlier(z=1.95)
- Business interpretation: This record has anomaly score 0.7208 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 1. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 84062
- Anomaly score: 0.7056
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 5 feature(s); Z-score outlier in 4 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: loan_amount=high_outlier(z=5.86); property_value=high_outlier(z=5.18); tract_to_msa_income_percentage=high_outlier(z=4.66); total_loan_costs=high_outlier(z=3.48); interest_rate=low_outlier(z=1.89)
- Business interpretation: This record has anomaly score 0.7056 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 0. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

### Review Record Index 64117
- Anomaly score: 0.7005
- Type: Cluster noise / structurally isolated profile
- Explanation: flagged by Isolation Forest; IQR outlier in 7 feature(s); Z-score outlier in 3 feature(s); identified as DBSCAN noise in Phase 2; far from its K-Means cluster centroid; domain flags: top_1_percent_loan_amount; top_1_percent_property_value; top_1_percent_income; top outlier features: loan_amount=high_outlier(z=4.74); property_value=high_outlier(z=3.94); total_loan_costs=high_outlier(z=3.78); debt_to_income_ratio_midpoint=low_outlier(z=2.68); tract_to_msa_income_percentage=high_outlier(z=2.27)
- Business interpretation: This record has anomaly score 0.7005 and is categorized as 'Cluster noise / structurally isolated profile'. Application outcome: Loan originated. K-Means cluster: 0. Recommended action: compare with Phase 2 cluster profiles because this profile does not fit dense segments.

## Deliverables
- Anomaly scored dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_anomaly_scored_phase4.csv`
- Flagged anomaly records: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_flagged_anomaly_records.csv`
- Top anomalies for review: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_top_anomalies_for_review.csv`
- Statistical outlier report: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_statistical_outlier_report.csv`
- Isolation Forest report: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_isolation_forest_report.csv`
- Anomaly type summary: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_anomaly_type_summary.csv`
- Cluster cross-reference: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\phase4_cluster_cross_reference.csv`

## Visualizations
- Final anomaly score distribution: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\plots\phase4_anomaly_score_distribution.png`
- Isolation Forest score distribution: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\plots\phase4_isolation_forest_score_distribution.png`
- PCA anomaly visualization: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\plots\phase4_pca_anomaly_visualization.png`
- Anomaly type count plot: `D:\Projects\DM\HMDA Mortgage\reports\anomaly_detection\plots\phase4_anomaly_type_counts.png`

## Interpretation Notes
- A flagged anomaly is not automatically an error.
- Statistical outliers may represent rare but legitimate mortgage profiles.
- Domain rules are used to guide review, not to prove misconduct or data error.
- Isolation Forest detects unusual multivariate structure, not causal risk.
- DBSCAN noise and K-Means distance outliers should be compared with Phase 2 cluster profiles.

## Recommended Next Step
- Use `phase4_top_anomalies_for_review.csv` for manual investigation.
- Compare anomaly types with cluster profiles and association rules from previous phases.
- Use the anomaly summary in the final dashboard/storytelling phase.