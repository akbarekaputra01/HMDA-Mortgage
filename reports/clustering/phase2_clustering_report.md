# Phase 2 Clustering Report

## Project
HMDA Mortgage 2022 - Segmentation via Clustering

## Phase Goal
Identify naturally occurring groupings within the data and translate each group into a meaningful profile that describes real-world financial or mortgage behavior.

## Input Dataset
- Clean dataset from Phase 1: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_clean_phase1.csv`
- Rows: 99,994
- Columns: 205

## Clustering Feature Set
The clustering feature set focuses on financial, risk, loan, pricing, and tract-level characteristics.

- `income`
- `debt_to_income_ratio_midpoint`
- `loan_amount`
- `property_value`
- `combined_loan_to_value_ratio`
- `interest_rate`
- `rate_spread`
- `loan_term`
- `total_loan_costs`
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

Sensitive demographic fields such as race, ethnicity, sex, and applicant age were not used as clustering input. They may be analyzed after cluster creation for fairness-oriented EDA, but they should not be used to form predictive models.

## K-Means Evaluation
- K values tested: 2 to 10
- Evaluation sample size: 10,000
- Suggested K based on combined internal validity ranking: `4`
- Evaluation file: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_kmeans_evaluation.csv`
- Elbow plot: `D:\Projects\DM\HMDA Mortgage\reports\clustering\plots\phase2_elbow_method.png`
- Silhouette plot: `D:\Projects\DM\HMDA Mortgage\reports\clustering\plots\phase2_silhouette_score.png`

## Final K-Means Cluster Sizes
- Cluster 0: 40,332 records (40.33%)
- Cluster 1: 5,470 records (5.47%)
- Cluster 2: 54,161 records (54.16%)
- Cluster 3: 31 records (0.03%)

## Cluster Business Profiles
### Cluster 0: Moderate Mixed Financial Profile Segment
Cluster 0 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 40,332 records (40.33% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: higher borrower income.

### Cluster 1: Moderate Mixed Financial Profile Segment
Cluster 1 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 5,470 records (5.47% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: No strong financial strength signal from the selected numeric features..

### Cluster 2: Moderate Mixed Financial Profile Segment
Cluster 2 is interpreted as 'Moderate Mixed Financial Profile Segment'. It represents 54,161 records (54.16% of the sample). Main risk signals: No strong elevated risk signal from the selected numeric features.. Main strength/context signals: No strong financial strength signal from the selected numeric features..

### Cluster 3: Financially Constrained Higher-Risk Segment
Cluster 3 is interpreted as 'Financially Constrained Higher-Risk Segment'. It represents 31 records (0.03% of the sample). Main risk signals: high loan-to-value exposure; lower borrower income. Main strength/context signals: No strong financial strength signal from the selected numeric features..

## DBSCAN Noise Detection
- DBSCAN sample size: 30,000
- min_samples: 38
- eps auto-estimate: 3.4065
- Number of clusters excluding noise: 1
- Noise points: 458 (1.53%)
- DBSCAN report file: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_dbscan_noise_report.csv`
- K-distance plot: `D:\Projects\DM\HMDA Mortgage\reports\clustering\plots\phase2_dbscan_k_distance.png`
- DBSCAN PCA plot: `D:\Projects\DM\HMDA Mortgage\reports\clustering\plots\phase2_dbscan_pca_noise.png`

## Hierarchical Clustering
- Hierarchical sample size: 3,000
- Linkage methods compared: ward, complete, average, single
- Hierarchical comparison file: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_hierarchical_report.csv`

## Deliverables
- Clustered dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_clustered_phase2.csv`
- Cluster feature dataset: `D:\Projects\DM\HMDA Mortgage\data\processed\hmda_2022_cluster_features_phase2.csv`
- K-Means evaluation: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_kmeans_evaluation.csv`
- Cluster numeric profile: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_cluster_profile.csv`
- Cluster readable profile: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_cluster_profile_readable.csv`
- Cluster categorical distribution: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_cluster_categorical_distribution.csv`
- DBSCAN report: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_dbscan_noise_report.csv`
- Hierarchical report: `D:\Projects\DM\HMDA Mortgage\reports\clustering\phase2_hierarchical_report.csv`

## Notes for Next Phase
- Use `cluster_kmeans` as a segmentation label for visualization and business interpretation.
- Use DBSCAN noise points as candidate anomaly profiles.
- For Association Rule Mining, cluster labels can be included as categorical items, for example `cluster_kmeans=2`.
- Validate cluster names manually using domain knowledge before final reporting.