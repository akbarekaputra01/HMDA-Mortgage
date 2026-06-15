# Dashboard Guide - HMDA Mortgage 2022

## Recommended Tool
Google Looker Studio, Power BI, Tableau Public, or Python dashboard tools can use the exported CSV files.

## Main Data Files

1. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_main_sample.csv`
   - Use for record-level exploration, scatter plots, filtering, and drill-down.

2. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_kpi_summary.csv`
   - Use for KPI cards.

3. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_action_taken_summary.csv`
   - Use for application outcome distribution.

4. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_cluster_summary.csv`
   - Use for cluster size, denial rate, anomaly rate, and cluster interpretation.

5. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_top_rules.csv`
   - Use for top association rules table.

6. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_anomaly_summary.csv`
   - Use for anomaly type distribution.

7. `D:\Projects\DM\HMDA Mortgage\dashboard\data\dashboard_state_summary.csv`
   - Use for geographic summaries.

## Suggested Dashboard Pages

### Page 1 - Executive Overview
- KPI cards: total records, originated %, denied %, anomaly %.
- Bar chart: action_taken distribution.
- Bar chart: loan type and loan purpose.

### Page 2 - Segmentation
- Cluster size distribution.
- Cluster financial profile heatmap.
- Cluster table with business interpretation.

### Page 3 - Association Rule Mining
- Top 10 rules table.
- Lift bar chart.
- Short explanation of support, confidence, and lift.

### Page 4 - Anomaly Detection
- Anomaly type distribution.
- Anomaly score histogram.
- Top anomaly records table.

### Page 5 - Fairness-Oriented EDA
- Outcome summaries by race, ethnicity, sex, and age group.
- Include clear note: demographic features are used for analysis, not predictive modeling.

## Interpretation Warning
Association rules and clustering show patterns, not causal relationships. Anomaly detection shows unusual profiles, not automatic fraud or error.