# Knowledge Discovery Report — HMDA Mortgage Lending, 2022

**Prepared for:** Bank leadership, lending policy, and fair-lending compliance stakeholders
**Data:** U.S. mortgage applications reported under the Home Mortgage Disclosure Act (HMDA), 2022 activity year, published by the Consumer Financial Protection Bureau. Full file: 16,080,210 applications; this analysis uses a representative 100,000-application sample.
**Companion materials:** interactive dashboard (`dashboard.html`), full technical notebook (`notebooks/main.ipynb`)

---

## Why this report exists

Anyone can run a pivot table on this data and see, for example, that most applications get approved, or that Texas and California have the most volume. That much is obvious from the raw file. This report exists to answer a harder question: **what did we find that a pivot table would not show you?** Every finding below required combining several analysis techniques — segmentation, pattern mining, and anomaly detection — and checking them against each other. Two of the four headline findings are trustworthy specifically *because* independent methods, run separately by different techniques, landed on the same answer without being designed to agree.

---

## The four applicant segments

We grouped the 100,000 applications into four naturally distinct segments based on their financial and demographic profile, without telling the software anything about loan outcomes in advance. Four segments emerged:

| Segment | Share | Who they are |
|---|---|---|
| **Joint Mid-to-High Income Buyers** | 35% | Couples/co-applicants, income around $126K, mid-to-upper-range loans, more than 6 in 10 loans go through to origination. |
| **Withdrawn / High-Value Applications** | 23% | The segment most defined by applicants pulling out of the process (37% withdrawal rate — more than double any other segment). |
| **Purchased / Secondary-Market Loans** | 10% | The smallest segment, and the odd one out: 8 in 10 of these loans were **bought from another lender** rather than originated directly, and their demographic fields are almost entirely blank (see below). |
| **Standard Originated Starter Loans** | 31% | The most "textbook" segment: lower loan amounts, lower property values, and the highest successful-origination rate (80%) of any group. |

**A correction we found and want to be upfront about:** our first pass at this analysis reported Segment "Purchased/Secondary-Market" as having the *highest* income of all four segments ($163,500) and Segment "Withdrawn/High-Value" as having the *highest* property value ($554,000). On closer inspection, most of those numbers turned out to be a placeholder our own cleaning process inserted for missing data, not real reported figures. Once we exclude the placeholder and use only genuinely reported values, the true income for the "Purchased" segment is $107,000 (not the highest — actually below segment 1), and the true property value for the "Withdrawn" segment is $435,000. We flag this explicitly because presenting the uncorrected numbers to a decision-maker would have led to the wrong conclusion about which customers are actually the highest earners.

---

## What drives approval, denial, and withdrawal

We mined the data for combinations of applicant and loan attributes that occur together far more often than random chance would predict. Here is what surfaced, ranked by how surprising and well-supported it is:

### 1. Loans bought from other lenders are missing demographic data — and we found this three separate ways

Applications where the loan was **purchased on the secondary market** (bought from the originating lender) are missing race, sex, and ethnicity information 96–98% of the time. We didn't just notice this once — three independent parts of the analysis landed on it separately: the segmentation grouped these loans into their own cluster, the pattern-mining step found this exact pairing with very high statistical strength (occurring roughly 12 times more often than chance would predict), and a network map of all discovered patterns showed this relationship as by far the most densely connected node in the entire map. When three unrelated techniques agree, that's a real, structural fact about how this data gets reported — not a coincidence.

**What this means for the business:** if you're using this dataset (or one like it) to monitor fair-lending outcomes by race, sex, or ethnicity, purchased loans will systematically distort your denominators. They should be flagged and handled separately, not treated as missing data to be filled in.

### 2. Applications that get withdrawn show the same missing-data pattern — for a different reason

Separately from the purchased-loan pattern above, applications marked **"withdrawn"** for medium-to-high-value properties are also missing demographic data at a high rate (87% confidence) — and this is the single strongest pattern found anywhere in the data. Unlike the purchased-loan case, this isn't about how a loan gets reported after the fact; it points to applicants leaving the process *before* the bank finished collecting their information.

**What this means for the business:** this looks like a process/friction signal, not a reporting artifact. It's worth asking whether the application experience for medium-to-high-value purchases has a drop-off point where demographic collection happens too late or feels intrusive.

### 3. High debt burden is a broad, consistent reason for denial — not specific to any one group

Among applications that were denied, having a debt-to-income ratio above 60% predicted a debt-to-income-coded denial reason with 70–77% confidence, and this held up consistently across property values, loan types, purposes, and age groups. In plain terms: this is a genuine, broad underwriting rule at work in the data, not an artifact of one lender, one product, or one demographic group.

### 4. Loans bought on the secondary market skew toward mid-to-upper income, not the lowest earners

Among purchased loans, income tends to fall in the medium-to-high band rather than being spread evenly. Given that programs like FHA loans are designed with first-time and lower-income buyers in mind, this is worth a closer look at whether the loans being picked up by secondary-market buyers reflect that original intent.

---

## Unusual and flagged records

We checked every application three different ways for anything unusual: simple statistical thresholds (an amount far outside the normal range), a more robust statistical check, and a machine-learning method that looks at all attributes of an application together rather than one at a time.

- **2,635 applications** (2.6% of the sample) were flagged as unusual by at least two of the three checks — these are the ones worth a human look.
- **228 applications** were flagged by all three simultaneously — the strongest candidates.
- Of those 228, **7 in 10 turned out to be the same missing-data placeholder problem described above**, not genuinely unusual financial figures. We checked this specifically because the placeholder value is mathematically exact and detectable — any flagged record carrying that precise number is a data-quality flag, not a business risk flag.
- After removing that noise, the remaining flagged applications fall into three honest categories: **a small number of jumbo/high-value loans** that are unusual but perfectly plausible (e.g., a $2.4M loan against $3.5M property and $548K income — a legitimate high-net-worth profile); **one likely data-entry problem** (a reported income of roughly $8.9M against a $45,000 loan, which is implausible enough to warrant checking the source record); and **a handful of applications combining a high interest rate with denial or thin serviceability**, which are the closest thing in this dataset to a genuine early-warning signal and are worth routing to underwriting for pattern review.
- Statistically unusual applications are not spread evenly across the four segments — they show up almost twice as often as average in the "Joint Mid-to-High Income" segment and more than twice as often in the "Purchased/Secondary-Market" segment, while the "Withdrawn" and "Standard Starter Loan" segments are unusually *quiet*. That itself is useful: it tells you where to concentrate manual review effort.

---

## The central question: what did we discover that wasn't already obvious?

Four things, none of which a simple report or pivot table on the raw file would have shown you:

1. **Purchased loans are structurally missing demographic data, and we know this because three unrelated techniques converged on it independently** — not a guess, a triangulated fact.
2. **A large share of what looked like "unusual" financial figures were actually a side effect of how we filled in missing data, not real outliers** — this is a discovery about the data's own reliability, and it changed two of our segment profiles.
3. **Withdrawn applications carry the same missing-data fingerprint as purchased loans, but for a different, previously undocumented reason** — a process signal nobody was looking for.
4. **The applicant population doesn't naturally split into tight, separate clusters — it's a continuum.** Our four segments are a useful business lens, not a "hidden truth" the data was waiting to reveal. That distinction matters if these segments are ever used to justify pricing or policy differences: they should be understood as a practical grouping tool, not an objective fact about who is fundamentally "different."

---

## Recommendations

1. **Exclude or separately flag purchased loans** before computing any fair-lending or demographic-outcome metrics — their missing data will otherwise silently distort the results.
2. **Investigate the withdrawal/disclosure process** for medium-to-high-value property applications; the pattern found here suggests a specific friction point, not random attrition.
3. **Treat debt-to-income above 60% as a confirmed, broad underwriting signal** — it held up across every segment we checked it against.
4. **Route the "high interest rate + denial/thin serviceability" flagged applications to underwriting** for manual pattern review; this is the most business-relevant anomaly category found.
5. **Audit the missing-value imputation step in any future data pipeline built on this dataset** — the placeholder-detection technique used here (checking for the exact mean value) is cheap to run and should be a standard data-quality check before reporting any segment-level financial statistic.
