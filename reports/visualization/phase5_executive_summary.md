# Executive Summary - HMDA Mortgage 2022

## One-Sentence Summary
This project uses the KDD framework to transform raw HMDA mortgage application data into interpretable segments, association patterns, anomaly signals, and dashboard-ready business insights.

## Key Numbers
- Records analyzed: 99,994
- Originated loans: 52,346 (52.35%)
- Denied applications: 15,344 (15.34%)
- Clusters discovered: 4
- Flagged anomalies: 31,690 (31.69%)

## Main Discoveries
1. **Dominant application outcome** — The most common application outcome is `Loan originated`, covering 52.35% of the sample.
2. **Clusters show different outcome profiles** — Cluster `2` has the highest denial rate (17.44%), while cluster `1` has the lowest denial rate (0.00%).
3. **Anomalies are not one single type** — The most frequent flagged anomaly type is `Multivariate statistical outlier`, with 20,193 records.
4. **Association rules reveal non-obvious co-occurrence** — The strongest top rule by lift is `applicant_age=8888 AND occupancy_type_label=Principal residence -> action_taken_label=Purchased loan` with lift 10.16.
5. **Geographic summaries show uneven outcome rates** — Among states with at least 200 records in the sample, `MS` has one of the highest denial rates at 22.63%.

## Business Interpretation
The dataset is not just a list of mortgage applications. After preprocessing and mining, it shows distinguishable applicant/loan profiles, non-obvious co-occurrence rules, and unusual cases that deserve review. The most valuable result is not a prediction score, but a structured understanding of how financial, loan, geographic, and application attributes appear together.

## Recommended Use
- Use the dashboard for presentation and exploration.
- Use cluster profiles to explain market/application segments.
- Use association rules as storytelling evidence for hidden patterns.
- Use anomaly reports as a review queue, not as automatic fraud/error labels.
- Use demographic features only for EDA/fairness insight, not predictive modeling.