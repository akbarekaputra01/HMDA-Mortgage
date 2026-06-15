# 10-Minute Presentation Outline - HMDA Mortgage 2022

## Slide 1 - Title and Team Roles
- Project title: HMDA Mortgage 2022 Data Mining
- Mention roles: Data Engineer, Segmentation Specialist, Pattern Analyst, Insight Communicator.

## Slide 2 - Problem and Dataset
- Dataset: HMDA 2022 mortgage application records.
- Goal: discover hidden knowledge, not maximize prediction accuracy.

## Slide 3 - KDD Workflow
- Phase 1: preprocessing
- Phase 2: clustering
- Phase 3: association rules
- Phase 4: anomaly detection
- Phase 5: visualization and knowledge presentation

## Slide 4 - Data Understanding and Preprocessing
- Explain missing values, mixed types, binning, normalization, and feature selection.
- Mention special HMDA tokens: NA, Exempt, blank, 8888, 9999.

## Slide 5 - Clustering Results
- Show cluster size chart.
- Show cluster financial profile heatmap.
- Explain 2–3 meaningful cluster profiles.

## Slide 6 - Association Rule Mining
- Explain support, confidence, and lift in plain language.
- Show top 3 strongest business rules.

## Slide 7 - Anomaly Detection
- Explain IQR, Z-score, Isolation Forest, and cluster outliers.
- Show anomaly type distribution.
- Emphasize anomaly is review signal, not automatic fraud/error.

## Slide 8 - Dashboard
- Show dashboard pages or screenshots.
- Explain how non-technical users can explore results.

## Slide 9 - Key Discoveries
- Present 3–5 discoveries from the knowledge report.
- Focus on non-obvious findings from combined mining methods.

## Slide 10 - Conclusion and Ethical Note
- Sensitive demographic features used for EDA/fairness insight.
- Sensitive demographic features should be removed for predictive classification.
- Final message: the project transforms raw HMDA data into actionable knowledge.