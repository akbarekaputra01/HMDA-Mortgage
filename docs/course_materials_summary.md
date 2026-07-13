# Data Mining Course Materials - Comprehensive Summary

## Document Overview
This document synthesizes key concepts from all 8 course sessions and demonstrates their practical application in the HMDA Mortgage Data Mining Project.

---

## Session 1: Introduction to Data Mining

### Key Concepts

**Data Mining Definition**
- Process of discovering interesting patterns, models, and knowledge in large datasets
- Also known as: Knowledge Discovery from Data (KDD), Pattern Discovery, Data Analytics

**KDD Process Flow**
1. **Data Pre-Processing**
   - Data integration
   - Data normalization
   - Feature selection
   - Dimension reduction

2. **Data Mining**
   - Pattern discovery
   - Association & correlation
   - Classification
   - Clustering
   - Outlier analysis

3. **Post-Processing**
   - Pattern evaluation
   - Pattern selection
   - Pattern interpretation
   - Pattern visualization

**Data Mining Tasks**
- **Descriptive**: Characterizes properties of data (e.g., clustering, summarization)
- **Predictive**: Makes predictions based on inference (e.g., classification, regression)

**Core Mining Tasks**
1. Multidimensional Data Summarization
2. Mining Frequent Patterns & Associations
3. Classification and Regression
4. Cluster Analysis
5. Deep Learning
6. Outlier/Anomaly Analysis

### Application to HMDA Project
✓ **Implemented in Phase 1**: Complete data preprocessing pipeline
✓ **Implemented in Phase 2**: Cluster analysis (K-Means, DBSCAN, Hierarchical)
✓ **Implemented in Phase 3**: Association rule mining
✓ **Implemented in Phase 4**: Anomaly detection
✓ **Implemented in Phase 5**: Knowledge visualization and presentation

---

## Session 2: Data Warehousing and OLAP

### Key Concepts

**Data Warehouse Characteristics** (W.H. Inmon Definition)
1. **Subject-Oriented**: Organized around major subjects (customer, product, sales)
2. **Integrated**: Combines data from multiple heterogeneous sources
3. **Time-Variant**: Maintains historical perspective (5-10 years)
4. **Nonvolatile**: Physically separate, no transaction processing required

**OLTP vs OLAP**

| Aspect | OLTP | OLAP |
|--------|------|------|
| Users | Clerk, IT professional | Knowledge worker |
| Function | Day-to-day operations | Decision support |
| DB Design | Application-oriented | Subject-oriented |
| Data | Current, detailed, flat | Historical, summarized, multidimensional |
| Usage | Repetitive | Ad-hoc |
| Access | Read/write, indexed | Lots of scans |
| Unit of Work | Short transaction | Complex query |
| DB Size | 100MB-GB | 100GB-TB |

**Data Warehouse Modeling**
1. **Star Schema**: Fact table + dimension tables
2. **Snowflake Schema**: Normalized dimension tables
3. **Fact Constellation**: Multiple fact tables sharing dimensions

### Application to HMDA Project
✓ **Subject-Oriented**: Focused on mortgage lending (applicants, loans, institutions)
✓ **Integrated**: Combined multiple data attributes from HMDA dataset
✓ **Analytical Focus**: OLAP-style analysis for decision support
✓ **Multidimensional Analysis**: Analyzed by state, loan type, action taken, etc.

---

## Session 3: Data and Measurement

### Key Concepts

**Data Types**
1. **Nominal**: Categorical, no order (e.g., ID, eye color, zip codes)
2. **Ordinal**: Ordered categories (e.g., rankings, height categories)
3. **Interval**: Numeric with meaningful differences (e.g., calendar dates)
4. **Ratio**: Numeric with meaningful zero point (e.g., age, income, mass)

**Discrete vs Continuous**
- **Discrete**: Finite or countably infinite (zip codes, counts)
- **Continuous**: Real numbers (temperature, height, weight)

**Central Tendency Measures**
- **Mean**: Average value (μ = Σx/n)
- **Median**: Middle value (50th percentile)
- **Mode**: Most frequent value
- **Midrange**: (max + min) / 2

**Distribution Characteristics**
- **Symmetric**: Mean = Median = Mode
- **Positively Skewed**: Mean > Median > Mode
- **Negatively Skewed**: Mode > Median > Mean

**Dispersion Measures**
- **Range**: max - min
- **Quartiles**: Q1 (25%), Q3 (75%)
- **IQR**: Q3 - Q1
- **Variance**: σ² = Σ(xi - μ)² / N
- **Standard Deviation**: σ = √σ²

**Correlation Analysis**
- **Chi-Square Test (χ²)**: For categorical data independence
- **Correlation Coefficient (ρ)**: For numeric data relationships
  - ρ > 0: Positive correlation
  - ρ = 0: Independent
  - ρ < 0: Negative correlation
  - Range: [-1, 1]

**Visualization Tools**
- **Boxplot**: Five-number summary (min, Q1, median, Q3, max)
- **Histogram**: Frequency distribution
- **Quantile Plot**: Cumulative distribution
- **Q-Q Plot**: Compare two distributions
- **Scatter Plot**: Bivariate relationships

### Application to HMDA Project
✓ **Data Type Handling**: Mixed nominal (state, action_taken), ordinal (derived_race, derived_sex), and ratio (income, loan_amount)
✓ **Statistical Analysis**: Computed means, medians, and distributions
✓ **Outlier Detection**: Used IQR and statistical methods (Phase 4)
✓ **Correlation Analysis**: Analyzed relationships between loan attributes
✓ **Visualization**: Extensive use of boxplots, histograms, and scatter plots (Phase 5)

---

## Session 4: Data Preparation I

### Key Concepts

**Data Quality Measures**
1. **Accuracy**: Correctness of data
2. **Completeness**: Extent of missing data
3. **Consistency**: Uniformity across sources
4. **Timeliness**: Data currency
5. **Believability**: Trustworthiness
6. **Interpretability**: Ease of understanding

**Data Quality Issues**
- **Incomplete**: Missing attribute values (e.g., Occupation="")
- **Noisy**: Errors, outliers (e.g., Salary="-10")
- **Inconsistent**: Discrepancies (e.g., Age="42", Birthday="03/07/2010")
- **Intentional**: Disguised missing data

**Handling Missing Values**
1. **Ignore the tuple**: When class label is missing
2. **Fill manually**: Human intervention
3. **Fill with global constant**: "unknown" or -∞
4. **Fill with measure of central tendency**: Mean or median
5. **Fill with class-based measure**: Mean/median for same class
6. **Fill with most probable value**: Bayesian, decision tree

**Handling Noisy Data**
1. **Binning**: Sort and distribute into bins, smooth by bin means/median/boundaries
2. **Regression**: Fit data into functions
3. **Clustering**: Detect and remove outliers
4. **Combined inspection**: Human + computer

**Discretization by Binning**
- **Equal-Width**: Uniform intervals W = (B-A)/N
- **Equal-Depth (Equal-Frequency)**: Same number of samples per bin

**Data Integration**
- Combine data from multiple sources
- **Schema Integration**: Resolve naming differences (A.cust-id ≈ B.cust-#)
- **Entity Identification**: Match real-world entities (Bill Clinton = William Clinton)
- **Resolve Value Conflicts**: Different representations, scales, formats
- **Detect Redundancy**: Correlation and covariance analysis

### Application to HMDA Project
✓ **Data Cleaning**: Handled missing values in income, loan amount (Phase 1)
✓ **Outlier Treatment**: Identified and handled extreme values
✓ **Inconsistency Resolution**: Standardized categorical variables
✓ **Data Integration**: Combined multiple attributes into unified schema
✓ **Quality Assessment**: Documented data quality issues in preprocessing report

---

## Session 5: Data Preparation II

### Key Concepts

**Data Transformation Methods**
1. **Smoothing**: Remove noise
2. **Attribute Construction**: Create new features
3. **Aggregation**: Summarization
4. **Normalization**: Scale to smaller range
5. **Discretization**: Concept hierarchy climbing

**Normalization Techniques**

1. **Min-Max Normalization**: Scale to [new_min, new_max]
   ```
   v' = (v - min_A)/(max_A - min_A) × (new_max_A - new_min_A) + new_min_A
   ```

2. **Z-Score Normalization**: Standardize using mean and std dev
   ```
   v' = (v - μ_A) / σ_A
   ```

3. **Decimal Scaling**: 
   ```
   v' = v / 10^j  (where j is smallest integer such that Max(v') < 1)
   ```

**Discretization Methods**
- **Binning**: Top-down, unsupervised
- **Histogram Analysis**: Top-down, unsupervised
- **Clustering**: Unsupervised, top-down or bottom-up
- **Decision Tree**: Supervised, top-down
- **Correlation Analysis**: Supervised, bottom-up (Chi-merge)

**Data Reduction**

**Why?** Large datasets require long processing time

**Parametric Methods**
- Assume data fits a model
- Store only parameters
- Examples: Regression, Log-Linear Models

**Non-Parametric Methods**
- Do not assume models
- Examples: Histograms, Clustering, Sampling

**Sampling Types**
- **Simple Random**: Equal probability
- **Without Replacement**: No repetition
- **With Replacement**: Allows repetition
- **Stratified**: Sample from each partition proportionally

**Dimensionality Reduction**

**Curse of Dimensionality**
- Data becomes sparse in high dimensions
- Distance measures become less meaningful
- Combinations of subspaces grow exponentially

**Advantages of Reduction**
- Avoid curse of dimensionality
- Eliminate irrelevant features
- Reduce noise
- Decrease time and space requirements

**Methods**
1. **Feature Selection**: Find subset of original variables
2. **Feature Extraction**: Transform to fewer dimensions

**Principal Component Analysis (PCA)**
- Statistical procedure using orthogonal transformation
- Converts correlated variables to uncorrelated principal components
- Projects data onto smaller space
- Works for numeric data only
- Based on eigenvectors of covariance matrix

### Application to HMDA Project
✓ **Normalization**: Applied to numeric features (income, loan_amount) in Phase 1
✓ **Feature Engineering**: Created derived attributes
✓ **Dimensionality Reduction**: Used PCA for visualization (Phase 2, 5)
✓ **Discretization**: Binned continuous variables for association rule mining (Phase 3)
✓ **Data Reduction**: Sampled large dataset for efficient processing

---

## Session 6: Pattern Mining I

### Key Concepts

**Frequent Pattern Mining**
- **Frequent Pattern**: Pattern (itemset, subsequence) that occurs frequently
- **Applications**: Market basket analysis, cross-marketing, web log analysis, DNA sequences

**Basic Concepts**
- **Itemset**: Set of one or more items, k-itemset = {x₁, ..., xₖ}
- **Support Count**: Frequency of itemset occurrence
- **Relative Support**: Fraction of transactions containing itemset
- **Frequent Itemset**: Support ≥ minimum support threshold

**Association Rules**
- **Rule**: X → Y
- **Support (s)**: P(X ∪ Y) - probability transaction contains both X and Y
- **Confidence (c)**: P(Y|X) - conditional probability

Example: Beer → Diaper (60% support, 100% confidence)
- 60% of transactions contain both
- 100% of transactions with beer also have diaper

**Closed and Max-Patterns**
- **Closed Pattern**: Frequent itemset with no super-pattern having same support
- **Max-Pattern**: Frequent itemset with no frequent super-pattern
- **Purpose**: Reduce combinatorial explosion (100 items = 2¹⁰⁰-1 = 1.27×10³⁰ patterns)

**Apriori Algorithm**

**Principle**: Downward Closure Property
- If itemset is infrequent, its supersets must be infrequent
- If {beer, diaper, nuts} is frequent, so is {beer, diaper}

**Method**
1. Scan DB to find frequent 1-itemsets
2. Generate k+1 candidate itemsets from k frequent itemsets
3. Test candidates against DB
4. Terminate when no frequent/candidate sets can be generated

**Candidate Generation**
- **Step 1**: Self-join Lₖ
- **Step 2**: Prune candidates with infrequent subsets

**Improvements**
1. **Partition**: Scan DB only twice
   - Scan 1: Find local frequent patterns in partitions
   - Scan 2: Consolidate global frequent patterns

2. **DHP** (Dynamic Hashing and Pruning): Use hash table to reduce candidates

3. **Sampling**: Mine sample, verify in full DB, find missed patterns

4. **DIC** (Dynamic Itemset Counting): Start counting new itemsets early

### Application to HMDA Project
✓ **Association Rule Mining** (Phase 3): Discovered patterns in mortgage lending
✓ **Support-Confidence Framework**: Used min_support and min_confidence thresholds
✓ **Pattern Discovery**: Found relationships between loan characteristics
✓ **Rules Generated**: Examples like "High Income + Good Credit → Approval"

---

## Session 7: Pattern Mining II

### Key Concepts

**FP-Growth Algorithm**

**Bottlenecks of Apriori**
- Breadth-first search
- Huge number of candidates
- Tedious support counting

**FP-Growth Philosophy**
- Depth-first search
- No explicit candidate generation
- Grow long patterns from short ones using local frequent items
- "abc" is frequent → project DB on abc → if "d" is local frequent → "abcd" is frequent

**FP-Growth Steps**

1. **Construct FP-Tree**
   - Scan DB once, find frequent 1-itemsets
   - Sort items in frequency descending order (f-list)
   - Scan DB again, construct FP-tree

2. **Mine FP-Tree**
   - For each frequent item, construct conditional pattern base
   - Build conditional FP-tree
   - Recursively mine conditional FP-trees

**Benefits of FP-Tree**
- **Completeness**: Preserves all information for frequent pattern mining
- **Compactness**: 
  - Removes infrequent items
  - Orders by frequency (more frequent = more likely shared)
  - Never larger than original DB

**FP-Growth Advantages**
- Divide-and-conquer approach
- No candidate generation or testing
- Compressed database structure
- No repeated full DB scans
- Basic operations: counting local items, building sub-trees

**Vertical Format Mining: CHARM**
- **Vertical Format**: tid-list for each itemset
- **Tidset**: List of transaction IDs containing itemset
- **Diffset**: Track only differences between tidsets
- **Efficiency**: Vertical intersections for pattern derivation

**Mining Closed Patterns: CLOSET**
- Uses f-list in support ascending order
- Divide search space by items
- Recursive closed pattern discovery
- **CLOSET+**: Enhanced with itemset merging, sub-itemset pruning, hybrid tree projection

**Mining Max-Patterns: MaxMiner**
- Efficiently mine long patterns
- Prune search space using max-pattern property
- Check potential max-patterns to avoid redundant scanning

**Pattern Evaluation: Interestingness Measures**

**Lift (Correlation)**
```
lift(A,B) = P(A∪B) / (P(A) × P(B))
```
- lift > 1: Positive correlation
- lift = 1: Independent
- lift < 1: Negative correlation

**Chi-Square (χ²)**
- Test independence of categorical variables
- Higher χ² = more likely related

**Null-Invariant Measures**
- Not affected by large numbers of null transactions
- More robust for sparse data

**Visualization**
- Plane graphs: Support-confidence plots
- Rule graphs: Network visualizations

### Application to HMDA Project
✓ **Efficient Pattern Mining** (Phase 3): Generated association rules efficiently
✓ **Pattern Evaluation**: Used lift metric for rule quality assessment
✓ **Visualization**: Created support-confidence scatter plots
✓ **Top Rules**: Identified and visualized rules by lift (Phase 5)

---

## Session 8: Cluster Analysis I

### Key Concepts

**Cluster Analysis Definition**
- Task of grouping data objects where:
  - **Intra-cluster distances are minimized** (high similarity within clusters)
  - **Inter-cluster distances are maximized** (low similarity between clusters)

**Applications**
1. **Data Reduction**: Summarization, preprocessing
2. **Compression**: Image processing (vector quantization)
3. **Hypothesis Generation**: Pattern exploration
4. **Prediction**: Cluster-based predictions
5. **K-NN**: Localize search to clusters
6. **Outlier Detection**: Points far from any cluster

**Quality of Clustering**
- High intra-class similarity (cohesive within)
- Low inter-class similarity (distinctive between)
- Depends on: similarity measure, implementation, ability to find hidden patterns

**Types of Clustering**

1. **Hierarchical**: Create hierarchical decomposition
   - Methods: Diana, Agnes, BIRCH, CAMELEON

2. **Partitioning**: Non-overlapping subsets
   - Methods: K-Means, K-Medoids, CLARANS
   - Minimize sum of squared errors

3. **Density-Based**: Based on connectivity and density
   - Methods: DBSCAN, OPTICS, DenClue

4. **Grid-Based**: Multiple-level granularity
   - Methods: STING, WaveCluster, CLIQUE

5. **Model-Based**: Hypothesize model for each cluster
   - Fuzzy Clustering, Mixture Models, SOM

**Proximity Measures**

**Minkowski Distance** (L-h norm)
```
d(i,j) = (|xi1-xj1|^h + |xi2-xj2|^h + ... + |xip-xjp|^h)^(1/h)
```

**Special Cases**
- h=1: **Manhattan Distance** (L₁ norm, city block)
- h=2: **Euclidean Distance** (L₂ norm)
- h=∞: **Supremum Distance** (L_max norm, L_∞ norm)

**Properties** (Metric)
- d(i,j) > 0 if i ≠ j, and d(i,j) = 0 (positive definiteness)
- d(i,j) = d(j,i) (symmetry)
- d(i,j) ≤ d(i,k) + d(k,j) (triangle inequality)

**K-Means Algorithm**

**Steps**
1. Select K points as initial centroids
2. Repeat:
   - Form K clusters by assigning points to closest centroid
   - Recompute centroid of each cluster
3. Until centroids don't change

**Characteristics**
- Each cluster represented by center (mean) of cluster
- Closeness measured by Euclidean distance, cosine similarity, etc.
- Converges for common similarity measures
- Most convergence in first few iterations

**Complexity**: O(n × K × I × d)
- n = number of points
- K = number of clusters
- I = number of iterations
- d = number of attributes

**Strengths**
- Efficient: O(tkn) where t, k << n
- Simple and widely used

**Weaknesses**
- Need to specify K in advance
- Sensitive to noise and outliers
- Only applicable to continuous n-dimensional space
- Often terminates at local optimum
- Not suitable for non-convex shapes

**K-Medoids Algorithm**

**Concept**
- Instead of mean, use medoid (most centrally located object in cluster)
- More robust to outliers than K-means

**PAM** (Partitioning Around Medoids)
1. Start with initial set of medoids
2. Iteratively replace medoid with non-medoid if it improves total distance
3. Continue until no improvement

**Efficiency Improvements**
- **CLARA**: PAM on samples
- **CLARANS**: Randomized re-sampling

**Comparison**
- K-Means: O(tkn) - very efficient
- PAM: O(k(n-k)²) - computationally expensive
- CLARA: O(ks² + k(n-k)) - improved efficiency

### Application to HMDA Project
✓ **K-Means Clustering** (Phase 2): Segmented mortgage applicants/loans
✓ **DBSCAN** (Phase 2): Detected dense regions and outliers
✓ **Hierarchical Clustering** (Phase 2): Created dendrogram analysis
✓ **Cluster Evaluation**: Used elbow method, silhouette score
✓ **PCA Visualization**: Visualized clusters in 2D space (Phase 5)
✓ **Cluster Profiling**: Analyzed financial characteristics of each cluster

---

## Integration: Theory to Practice in HMDA Project

### Phase 1: Data Preprocessing
**Theory Applied**
- Sessions 1, 4, 5: KDD Process, Data Cleaning, Data Transformation
- Handled missing values, outliers, normalization
- Feature engineering and selection
- Data quality assessment

### Phase 2: Clustering Analysis
**Theory Applied**
- Session 8: K-Means, DBSCAN, Hierarchical Clustering
- Proximity measures (Euclidean distance)
- Elbow method for K selection
- Silhouette score for quality assessment
- PCA for dimensionality reduction and visualization

### Phase 3: Association Rule Mining
**Theory Applied**
- Sessions 6-7: Apriori, FP-Growth concepts
- Support-confidence framework
- Pattern evaluation using lift
- Discretization of continuous variables
- Rule visualization

### Phase 4: Anomaly Detection
**Theory Applied**
- Session 3: Statistical methods (IQR, Z-score)
- Session 1: Outlier analysis task
- Isolation Forest algorithm
- Statistical scoring and thresholding

### Phase 5: Knowledge Discovery & Visualization
**Theory Applied**
- Session 1: Knowledge presentation in KDD
- Session 3: Visualization techniques
- All sessions: Integrated insights from all phases
- Business intelligence reporting

---

## Key Takeaways

### Theoretical Foundations
1. **Data mining is a process**, not just algorithms
2. **Quality of results depends on quality of data** - preprocessing is crucial
3. **No single algorithm fits all problems** - need appropriate method selection
4. **Evaluation is essential** - use proper metrics and validation
5. **Visualization aids understanding** - patterns must be interpretable

### Practical Lessons from HMDA Project
1. **Domain knowledge matters** - understanding mortgage lending improved analysis
2. **Iterative refinement** - multiple phases built on previous insights
3. **Multiple techniques complement** - clustering + association rules + anomaly detection
4. **Scalability considerations** - sampling and optimization for large datasets
5. **Actionable insights** - translate patterns into business recommendations

### Data Mining Pipeline
```
Raw Data → Preprocessing → Mining → Evaluation → Visualization → Insights → Actions
```

### Success Factors
1. Clear problem definition
2. Quality data preparation
3. Appropriate algorithm selection
4. Rigorous evaluation
5. Effective communication of results

---

## References

Han, J., Kamber, M., & Pei, J. (2023). *Data Mining: Concepts and Techniques* (4th ed.). 
San Francisco, CA, USA: Morgan Kaufmann Publishers Inc.

---

*Document created: 2026-06-23*
*Project: HMDA Mortgage Data Mining*
*Course: COMP6140001 – Data Mining*
