# Phase 3 Association Rule Mining Report

## Project
HMDA Mortgage 2022 - Association Rule Mining

## Phase Goal
Surface co-occurrence patterns in the data that reveal non-obvious relationships between attributes, findings that cannot be seen through simple tabulation or aggregation.

## Input Dataset
- Input file: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_clustered_phase2.csv`
- Rows in input dataset: 99,994
- Rows used for ARM: 99,994

## ARM Methodology
- Continuous variables were discretized into categorical bins before rule mining.
- The Apriori algorithm was used to discover frequent itemsets.
- Rules were evaluated using Support, Confidence, Lift, Leverage, Conviction, and Zhang's Metric.
- Rules were filtered to prioritize non-trivial, interpretable, high-lift findings.
- Missing-like values such as `NA`, `BLANK`, `MISSING`, and `Exempt` were excluded from transaction items.

## Ethical Note
- Sensitive demographic attributes were included for EDA/pattern discovery because the project objective is analysis, not predictive classification. These attributes should be excluded from classification/predictive modeling.

## Parameters
- Maximum itemset length: 3
- Minimum item support pre-filter: 0.003
- Final minimum support used: 0.03
- Final minimum confidence used: 0.6
- Minimum lift filter: 1.1

## Item Columns Used
- `action_taken_label`
- `cluster_kmeans_label`
- `loan_type_label`
- `loan_purpose_label`
- `lien_status_label`
- `preapproval_label`
- `conforming_loan_limit`
- `construction_method_label`
- `occupancy_type_label`
- `derived_dwelling_category`
- `reverse_mortgage_label`
- `open_end_line_of_credit_label`
- `business_or_commercial_purpose_label`
- `negative_amortization_label`
- `interest_only_payment_label`
- `balloon_payment_label`
- `other_nonamortizing_features_label`
- `debt_to_income_ratio_bucket`
- `income_bin`
- `loan_amount_bin`
- `property_value_bin`
- `combined_loan_to_value_ratio_bin`
- `interest_rate_bin`
- `rate_spread_bin`
- `tract_minority_population_percent_bin`
- `tract_to_msa_income_percentage_bin`
- `ffiec_msa_md_median_family_income_bin`
- `tract_population_bin`
- `derived_race`
- `derived_ethnicity`
- `derived_sex`
- `applicant_age`
- `applicant_age_above_62`

## Mining Results Summary
- Frequent itemsets discovered: 45,195
- Association rules generated: 69,236
- Filtered meaningful rules: 9,221
- Top business rules documented: 10

## Top 10 Business Rules
### Rule 1: Application outcome pattern
**Rule:** `applicant_age=8888 AND occupancy_type_label=Principal residence -> action_taken_label=Purchased loan`
- Support: 8.00%
- Confidence: 98.52%
- Lift: 10.161
- Business interpretation: Ketika kondisi [applicant_age=8888; occupancy_type_label=Principal residence] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 98.52%. Rule ini mencakup sekitar 8.00% data (estimasi 8,001 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 10.16 berarti 10.16x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 2: Application outcome pattern
**Rule:** `applicant_age=8888 AND business_or_commercial_purpose_label=No -> action_taken_label=Purchased loan`
- Support: 8.23%
- Confidence: 98.47%
- Lift: 10.155
- Business interpretation: Ketika kondisi [applicant_age=8888; business_or_commercial_purpose_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 98.47%. Rule ini mencakup sekitar 8.23% data (estimasi 8,229 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 10.15 berarti 10.15x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 3: Application outcome pattern
**Rule:** `applicant_age=8888 AND balloon_payment_label=No -> action_taken_label=Purchased loan`
- Support: 8.38%
- Confidence: 91.66%
- Lift: 9.452
- Business interpretation: Ketika kondisi [applicant_age=8888; balloon_payment_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 91.66%. Rule ini mencakup sekitar 8.38% data (estimasi 8,382 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.45 berarti 9.45x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 4: Application outcome pattern
**Rule:** `applicant_age=8888 AND interest_rate_bin=interest_rate_low -> action_taken_label=Purchased loan`
- Support: 3.22%
- Confidence: 91.29%
- Lift: 9.415
- Business interpretation: Ketika kondisi [applicant_age=8888; interest_rate_bin=interest_rate_low] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 91.29%. Rule ini mencakup sekitar 3.22% data (estimasi 3,219 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.41 berarti 9.41x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 5: Application outcome pattern
**Rule:** `applicant_age=8888 AND combined_loan_to_value_ratio_bin=combined_loan_to_value_ratio_medium -> action_taken_label=Purchased loan`
- Support: 8.45%
- Confidence: 89.84%
- Lift: 9.265
- Business interpretation: Ketika kondisi [applicant_age=8888; combined_loan_to_value_ratio_bin=combined_loan_to_value_ratio_medium] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 89.84%. Rule ini mencakup sekitar 8.45% data (estimasi 8,452 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.26 berarti 9.26x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 6: Application outcome pattern
**Rule:** `applicant_age=8888 AND interest_only_payment_label=No -> action_taken_label=Purchased loan`
- Support: 8.29%
- Confidence: 89.57%
- Lift: 9.237
- Business interpretation: Ketika kondisi [applicant_age=8888; interest_only_payment_label=No] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 89.57%. Rule ini mencakup sekitar 8.29% data (estimasi 8,293 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.24 berarti 9.24x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 7: Application outcome pattern
**Rule:** `applicant_age=8888 AND cluster_kmeans_label=Cluster_0 -> action_taken_label=Purchased loan`
- Support: 3.26%
- Confidence: 88.43%
- Lift: 9.119
- Business interpretation: Ketika kondisi [applicant_age=8888; cluster_kmeans_label=Cluster_0] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 88.43%. Rule ini mencakup sekitar 3.26% data (estimasi 3,255 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 9.12 berarti 9.12x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 8: Application outcome pattern
**Rule:** `applicant_age=8888 AND conforming_loan_limit=C -> action_taken_label=Purchased loan`
- Support: 8.09%
- Confidence: 85.26%
- Lift: 8.792
- Business interpretation: Ketika kondisi [applicant_age=8888; conforming_loan_limit=C] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 85.26%. Rule ini mencakup sekitar 8.09% data (estimasi 8,089 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.79 berarti 8.79x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 9: Application outcome pattern
**Rule:** `applicant_age=8888 AND loan_purpose_label=Home purchase -> action_taken_label=Purchased loan`
- Support: 6.16%
- Confidence: 85.06%
- Lift: 8.772
- Business interpretation: Ketika kondisi [applicant_age=8888; loan_purpose_label=Home purchase] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 85.06%. Rule ini mencakup sekitar 6.16% data (estimasi 6,160 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.77 berarti 8.77x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

### Rule 10: Application outcome pattern
**Rule:** `applicant_age=8888 AND derived_dwelling_category=Single Family (1-4 Units):Site-Built -> action_taken_label=Purchased loan`
- Support: 8.20%
- Confidence: 84.31%
- Lift: 8.695
- Business interpretation: Ketika kondisi [applicant_age=8888; derived_dwelling_category=Single Family (1-4 Units):Site-Built] muncul, maka [action_taken_label=Purchased loan] terjadi dengan confidence 84.31%. Rule ini mencakup sekitar 8.20% data (estimasi 8,199 records dari sample). Baseline consequent adalah 9.70%, sehingga lift 8.69 berarti 8.69x lebih sering dibanding baseline consequent. Interpretasi ini menunjukkan pola ko-occurence, bukan hubungan sebab-akibat.

## Deliverables
- ARM transaction file: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_arm_transactions_phase3.csv`
- Frequent itemsets: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\phase3_frequent_itemsets.csv`
- All association rules: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\phase3_association_rules_all.csv`
- Filtered rules: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\phase3_association_rules_filtered.csv`
- Top 10 business rules: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\phase3_top10_business_rules.csv`
- Support-confidence plot: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\plots\phase3_support_confidence_scatter.png`
- Top 10 lift plot: `D:\Projects\DM\HMDA Mortgage\reports\association_rules\plots\phase3_top10_rules_by_lift.png`

## Notes for Interpretation
- Support shows how often a full rule appears in the dataset.
- Confidence shows how often the consequent appears when the antecedent appears.
- Lift compares rule strength against the baseline frequency of the consequent.
- Lift greater than 1 indicates positive association.
- Association rules describe co-occurrence patterns, not causal relationships.

## Notes for Next Phase
- Use high-lift rules as candidates for dashboard storytelling.
- Compare ARM findings with cluster profiles from Phase 2.
- Rules involving `cluster_kmeans_label` can help explain segment characteristics.
- Rules involving `action_taken_label` can help explain approval, denial, withdrawal, or incompleteness patterns.