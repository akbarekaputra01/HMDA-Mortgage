# Phase 5 Knowledge Discovery Report

## Project
HMDA Mortgage 2022 - Visualization and Knowledge Presentation

## Phase Goal
Communicate discovered knowledge to a non-technical audience clearly and convincingly. The measure of success is whether findings are actionable and non-trivial, not whether a model achieved high accuracy.

## Input Data
- Input dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_anomaly_scored_phase4.csv`
- Source phase: Phase 4 anomaly-scored dataset
- Records analyzed: 99,994
- Columns available: 294

## Executive KPI Summary
- Total records: 99,994
- Originated loans: 52,346 (52.35%)
- Denied applications: 15,344 (15.34%)
- Withdrawn applications: 13,659 (13.66%)
- Incomplete files: 5,014 (5.01%)
- Flagged anomalies: 31,690 (31.69%)
- Number of K-Means clusters: 4

## What We Discovered That Was Not Obvious From the Raw Data

### Discovery 1: Dominant application outcome
**Finding:** The most common application outcome is `Loan originated`, covering 52.35% of the sample.

**Business meaning:** This gives the baseline context for interpreting all later rules and clusters. A high-confidence rule is only interesting when it improves meaningfully over this baseline.

### Discovery 2: Clusters show different outcome profiles
**Finding:** Cluster `2` has the highest denial rate (17.44%), while cluster `1` has the lowest denial rate (0.00%).

**Business meaning:** This means segmentation reveals different financial/application profiles that are not visible from the raw table alone.

### Discovery 3: Anomalies are not one single type
**Finding:** The most frequent flagged anomaly type is `Multivariate statistical outlier`, with 20,193 records.

**Business meaning:** Anomaly detection should not be interpreted as automatic error detection. Some cases may be rare legitimate loans, some may be risk signals, and some may need data validation.

### Discovery 4: Association rules reveal non-obvious co-occurrence
**Finding:** The strongest top rule by lift is `applicant_age=8888 AND occupancy_type_label=Principal residence -> action_taken_label=Purchased loan` with lift 10.16.

**Business meaning:** Lift above 1 indicates the consequent appears more often under the antecedent condition than it does overall. This is useful for pattern discovery, not causal proof.

### Discovery 5: Geographic summaries show uneven outcome rates
**Finding:** Among states with at least 200 records in the sample, `MS` has one of the highest denial rates at 22.63%.

**Business meaning:** Geographic variation may reflect differences in local markets, borrower profiles, lender activity, or sample composition. It requires careful interpretation.

## Cluster Story

Clustering converted raw numeric financial and loan attributes into interpretable borrower/application segments. Instead of looking at individual variables separately, the cluster view shows groups of records with similar combined profiles.

### Moderate Mixed Financial Profile Segment
- Cluster ID: `2`
- Size: 54,161 records (54.16%)
- Denial rate: 17.44%
- Anomaly rate: 29.33%
- Interpretation: Cluster 2 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 54,161 records (54.16% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: No strong financial strength signal from the selected numeric features..

### Moderate Mixed Financial Profile Segment
- Cluster ID: `0`
- Size: 40,332 records (40.33%)
- Denial rate: 14.62%
- Anomaly rate: 31.65%
- Interpretation: Cluster 0 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 40,332 records (40.33% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: higher borrower income.

### Moderate Mixed Financial Profile Segment
- Cluster ID: `1`
- Size: 5,470 records (5.47%)
- Denial rate: 0.00%
- Anomaly rate: 54.94%
- Interpretation: Cluster 1 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 5,470 records (5.47% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: No strong financial strength signal from the selected numeric features..

### Financially Constrained Higher-Risk Segment
- Cluster ID: `3`
- Size: 31 records (0.03%)
- Denial rate: 12.90%
- Anomaly rate: 100.00%
- Interpretation: Cluster 3 is interpreted as 'Financially Constrained Higher-Risk Segment'. It represents 31 records (0.03% of the sample). Main risk signals: high loan-to-value exposure; lower borrower income. Main strength/context signals: No strong financial strength signal from the selected numeric features..

## Association Rule Story

Association Rule Mining was used to find co-occurrence patterns across discretized and categorical attributes. The main metrics are Support, Confidence, and Lift. Support tells how often a pattern appears, Confidence tells how often the consequent appears when the antecedent appears, and Lift compares that relationship against the baseline.

### Rule 1
- Rule: `applicant_age=8888 AND occupancy_type_label=Principal residence -> action_taken_label=Purchased loan`
- Support: 8.00%
- Confidence: 98.52%
- Lift: 10.16
- Business interpretation: Ketika kondisi [applicant_age=8888; occupancy_type_label=Principal residence] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 98.52%. Rule ini mencakup sekitar 8.00% data (estimasi 8,001 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 10.16 berarti 10.16x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 2
- Rule: `applicant_age=8888 AND business_or_commercial_purpose_label=No -> action_taken_label=Purchased loan`
- Support: 8.23%
- Confidence: 98.47%
- Lift: 10.15
- Business interpretation: Ketika kondisi [applicant_age=8888; business_or_commercial_purpose_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 98.47%. Rule ini mencakup sekitar 8.23% data (estimasi 8,229 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 10.15 berarti 10.15x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 3
- Rule: `applicant_age=8888 AND balloon_payment_label=No -> action_taken_label=Purchased loan`
- Support: 8.38%
- Confidence: 91.66%
- Lift: 9.45
- Business interpretation: Ketika kondisi [applicant_age=8888; balloon_payment_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 91.66%. Rule ini mencakup sekitar 8.38% data (estimasi 8,382 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.45 berarti 9.45x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 4
- Rule: `applicant_age=8888 AND interest_rate_bin=interest_rate_low -> action_taken_label=Purchased loan`
- Support: 3.22%
- Confidence: 91.29%
- Lift: 9.41
- Business interpretation: Ketika kondisi [applicant_age=8888; interest_rate_bin=interest_rate_low] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 91.29%. Rule ini mencakup sekitar 3.22% data (estimasi 3,219 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.41 berarti 9.41x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 5
- Rule: `applicant_age=8888 AND combined_loan_to_value_ratio_bin=combined_loan_to_value_ratio_medium -> action_taken_label=Purchased loan`
- Support: 8.45%
- Confidence: 89.84%
- Lift: 9.26
- Business interpretation: Ketika kondisi [applicant_age=8888; combined_loan_to_value_ratio_bin=combined_loan_to_value_ratio_medium] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 89.84%. Rule ini mencakup sekitar 8.45% data (estimasi 8,452 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.26 berarti 9.26x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 6
- Rule: `applicant_age=8888 AND interest_only_payment_label=No -> action_taken_label=Purchased loan`
- Support: 8.29%
- Confidence: 89.57%
- Lift: 9.24
- Business interpretation: Ketika kondisi [applicant_age=8888; interest_only_payment_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 89.57%. Rule ini mencakup sekitar 8.29% data (estimasi 8,293 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.24 berarti 9.24x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 7
- Rule: `applicant_age=8888 AND cluster_kmeans_label=Cluster_0 -> action_taken_label=Purchased loan`
- Support: 3.26%
- Confidence: 88.43%
- Lift: 9.12
- Business interpretation: Ketika kondisi [applicant_age=8888; cluster_kmeans_label=Cluster_0] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 88.43%. Rule ini mencakup sekitar 3.26% data (estimasi 3,255 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.12 berarti 9.12x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 8
- Rule: `applicant_age=8888 AND conforming_loan_limit=C -> action_taken_label=Purchased loan`
- Support: 8.09%
- Confidence: 85.26%
- Lift: 8.79
- Business interpretation: Ketika kondisi [applicant_age=8888; conforming_loan_limit=C] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 85.26%. Rule ini mencakup sekitar 8.09% data (estimasi 8,089 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.79 berarti 8.79x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 9
- Rule: `applicant_age=8888 AND loan_purpose_label=Home purchase -> action_taken_label=Purchased loan`
- Support: 6.16%
- Confidence: 85.06%
- Lift: 8.77
- Business interpretation: Ketika kondisi [applicant_age=8888; loan_purpose_label=Home purchase] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 85.06%. Rule ini mencakup sekitar 6.16% data (estimasi 6,160 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.77 berarti 8.77x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 10
- Rule: `applicant_age=8888 AND derived_dwelling_category=Single Family (1-4 Units):Site-Built -> action_taken_label=Purchased loan`
- Support: 8.20%
- Confidence: 84.31%
- Lift: 8.69
- Business interpretation: Ketika kondisi [applicant_age=8888; derived_dwelling_category=Single Family (1-4 Units):Site-Built] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 84.31%. Rule ini mencakup sekitar 8.20% data (estimasi 8,199 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.69 berarti 8.69x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

## Anomaly Story

Anomaly detection was used to flag records that deviate from normal patterns. The anomaly flag should not be interpreted as automatic error or fraud. It is a review signal.

- Multivariate statistical outlier: 20,193 records (63.72% of flagged anomalies)
- Potential financial risk signal: 7,556 records (23.84% of flagged anomalies)
- Rare but potentially legitimate high-value case: 1,886 records (5.95% of flagged anomalies)
- Structural anomaly detected by Isolation Forest: 961 records (3.03% of flagged anomalies)
- Far from assigned cluster centroid: 563 records (1.78% of flagged anomalies)
- Cluster noise / structurally isolated profile: 457 records (1.44% of flagged anomalies)
- Potential data quality issue: 74 records (0.23% of flagged anomalies)

## Dashboard Design

The dashboard should be structured into five pages:

1. **Executive Overview**: KPIs, action_taken distribution, loan type, loan purpose.
2. **Segmentation View**: cluster size, cluster financial profile, PCA cluster map.
3. **Pattern Mining View**: top association rules, lift/confidence/support explanation.
4. **Anomaly View**: anomaly type distribution, anomaly score distribution, top review cases.
5. **Fairness / Demographic EDA View**: demographic distributions and outcomes for analysis only, not predictive modeling.

## Ethical Note
Sensitive demographic attributes can be retained for analysis and fairness-oriented insight discovery. However, they should be removed if building classification or predictive models, consistent with the project guidance on ECOA-related concerns.

## Deliverables
- Dashboard main data: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_main_sample.csv`
- KPI summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_kpi_summary.csv`
- Action summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_action_taken_summary.csv`
- Cluster summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_cluster_summary.csv`
- Rules summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_top_rules.csv`
- Anomaly summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_anomaly_summary.csv`
- State summary: `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_state_summary.csv`
- Visualization plots folder: `D:\Projects\DM\HMDA Mortgage\reports\visualization\plots`

## Final Answer to the Central Question

The project discovered that HMDA mortgage application records contain structured patterns beyond simple raw fields. Clustering reveals groups of applications with distinct financial and risk profiles; association rules reveal combinations of attributes that co-occur more strongly than baseline; anomaly detection separates unusual records into data quality issues, rare legitimate profiles, and possible risk signals. These findings are non-trivial because they require combining multiple attributes and mining techniques rather than reading individual columns one by one.