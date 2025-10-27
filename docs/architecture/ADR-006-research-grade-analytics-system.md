# ADR-006: Research-Grade Analytics System for N=1 Self-Experimentation

**Status:** Approved
**Date:** 2025-10-26
**Deciders:** Kevy (with Codex MCP consultation)
**Context:** Building world-class research analytics infrastructure for personal self-optimization and future academic publication

## Context

Americano's Phase 2 dashboard implements behavioral psychology features (variable rewards, streaks, goal gradients). To validate these interventions scientifically and optimize personal learning, we need research-grade analytics capable of:

1. **N=1 experimental design** - Single-case designs (ABAB, multiple baseline)
2. **Causal inference** - Prove interventions cause effects, not just correlate
3. **Bayesian methods** - Update beliefs as data accumulates
4. **Publication quality** - CENT/SPIRIT compliance for academic papers
5. **Quantified self integration** - Correlate study behavior with physiological data (sleep, HRV)

**Current State (Epic 5):**
- Basic event tracking (`BehavioralEvent` model)
- ML predictions (73% accuracy for struggle prediction)
- Simple analytics (logistic regression, Ebbinghaus curves)
- PostgreSQL for both OLTP and analytics (will bottleneck)

**Gap:** Lacks SCED rigor, Bayesian causal inference, data quality gates, reproducibility infrastructure, and proper analytics architecture for research.

## Decision

Build a **research-grade analytics system** with the following architecture:

### 1. Database & Storage Architecture

**Problem:** PostgreSQL mixed OLTP/OLAP workloads cause performance bottlenecks.

**Solution:**
- **OLTP (Operational):** PostgreSQL with Row-Level Security (RLS)
  - Source of truth for all transactional data
  - RLS policies for future multi-tenant scale
- **OLAP (Analytics):** DuckDB/MotherDuck with Parquet storage
  - 10-100x faster for analytical queries
  - Local DuckDB for development, MotherDuck for production/collaboration
- **Transformation Layer:** dbt (data build tool)
  - Documented, tested SQL transformations
  - Lineage tracking from raw events to analysis-ready tables
- **Orchestration:** Dagster
  - Software-defined assets with dependencies
  - Schedule-based and sensor-based pipelines
  - Built-in lineage and observability

### 2. Enhanced Database Schema

**Add 4 new models for research rigor:**

#### `ExperimentProtocol` - CENT/SPIRIT Compliance
- Pre-registration of hypotheses, sample size, analysis plan
- Protocol deviation logging
- CONSORT-style flow diagram data

#### `PhaseAssignment` - SCED Experiment Tracking
- ABAB phase assignments with randomized lengths
- Intervention periods (baseline, intervention_A, intervention_B)
- Randomization seed for reproducibility

#### `ContextMetadata` - Normalized Context Tables
- Mood (enum: low, medium, high)
- Energy level (1-10 scale)
- Location (enum: home, library, cafe, etc.)
- Sleep quality (pulled from wearables)

#### `AnalysisRun` - Full Provenance Tracking
- Code commit hash (Git)
- Data version hash (DVC)
- Input parameters (JSON)
- Output artifacts (MLflow)
- Timestamps and run metadata

**Enhance `BehavioralEvent`:**
- Add `experiment_phase` (nullable string, e.g., "baseline_1", "intervention_A_1")
- Add `randomization_seed` (for SCED phase length randomization)
- Keep JSON `eventData` flexible but validate with Pandera schemas

### 3. Statistical Methods Stack

**Replace basic stats with research-grade methods:**

**For Causal Inference:**
- **Bayesian Interrupted Time Series (ITS):** CausalPy + PyMC
  - Estimate counterfactual: what would have happened without intervention?
  - Posterior distribution of causal effect size
  - 95% credible intervals (not confidence intervals - Bayesian approach)

- **Bayesian Structural Time Series (BSTS):** Orbit-ML
  - Account for trends, seasonality, external regressors
  - More sophisticated than basic ITS

- **Synthetic Control:** DoWhy/EconML
  - Create synthetic "you" from baseline period
  - Compare actual vs synthetic during intervention

**For N=1 Experimental Design:**
- **ABAB Randomization Tests:** Custom Python
  - Randomize phase labels 10,000 times
  - Calculate p-value: how often do random shuffles show bigger effect?
  - Meets What Works Clearinghouse SCED standards

- **Change Point Detection:** ruptures library
  - PELT algorithm to detect when behavior shifted
  - Useful when intervention date is unclear

**For Sequential Testing:**
- **Alpha-Spending Functions:** statsmodels
  - O'Brien-Fleming or Pocock boundaries
  - Allow continuous monitoring without "peeking" bias
  - UI warnings: "Don't stop early without alpha-spending!"

**For Mixed Effects:**
- **Bayesian Hierarchical Models:** Bambi + PyMC
  - Account for individual variability over time
  - Random intercepts/slopes for within-subject design

### 4. Data Quality & Observability

**Validate everything, monitor drift:**

**Schema Validation (Pandera):**
```python
import pandera as pa

event_schema = pa.DataFrameSchema({
    "user_id": pa.Column(str, checks=pa.Check.str_matches(r"^[a-z0-9]+$")),
    "event_type": pa.Column(str, checks=pa.Check.isin(["reward_trigger", "streak_milestone", ...])),
    "timestamp": pa.Column(pa.DateTime),
    "engagement_score": pa.Column(float, checks=pa.Check.in_range(0, 100)),
})

# Fail-fast before analysis
validated_df = event_schema.validate(raw_df)
```

**Drift Detection (Evidently):**
- Monitor data distributions over time
- Detect model performance degradation
- Alert when predictions drift from baseline

### 5. Reproducibility Infrastructure

**Version everything for publication:**

- **Data Versioning (DVC):** Track Parquet exports of events
- **Experiment Tracking (MLflow):** Log parameters, metrics, artifacts for every analysis
- **Code Versioning (Git):** Track analysis code with commit hashes
- **Pipeline Orchestration (Dagster):** Automate nightly ETL, weekly reports, on-demand analyses

**Publication Workflow:**
1. Write analysis in Jupyter notebook
2. Parameterize with papermill
3. Execute with MLflow tracking
4. Export to Quarto (markdown → LaTeX → PDF)
5. Figures automatically saved as publication-quality PDFs

### 6. Quantified Self Integration

**Connect wearables for multi-modal insights:**

- **OAuth Integration:** Oura, WHOOP, Apple Health
- **Daily Sync:** Sleep, HRV, activity data
- **Correlation Analysis:** "Focus drops when sleep < 7 hours" (Bayesian hierarchical model)

## Consequences

### Positive

✅ **Publication-ready from day 1:** CENT/SPIRIT compliance built-in
✅ **Causal claims with rigor:** Bayesian ITS, not just correlation
✅ **Reproducible research:** DVC + MLflow + Git + Dagster
✅ **Scale-ready architecture:** RLS + OLAP separation prepares for multi-institution
✅ **Data quality guaranteed:** Pandera + Evidently catch issues early
✅ **Full control:** No vendor lock-in, private data, custom methods

### Negative

❌ **Complexity:** 10-day implementation, learning curve for advanced methods
❌ **Cost:** ~$20/month for MotherDuck (vs free PostgreSQL)
❌ **Maintenance:** More moving parts (DuckDB, Dagster, MLflow, DVC)

### Neutral

⚖️ **Overkill for personal use?** Yes, but sets foundation for future research/scale
⚖️ **Python-heavy:** Aligns with medical research standards (scipy, statsmodels)

## Alternatives Considered

### Alternative 1: Use Vercel Analytics
**Rejected:** Consumer-grade metrics (page views, bounce rate), no research rigor, vendor lock-in, privacy concerns

### Alternative 2: Keep PostgreSQL for everything
**Rejected:** Mixed OLTP/OLAP workloads cause performance bottlenecks, no separation of concerns

### Alternative 3: Use third-party experiment platforms (Amplitude, Mixpanel, Optimizely)
**Rejected:** Not designed for n=1 SCED, no Bayesian methods, can't publish with their data

### Alternative 4: Basic Python scripts without infrastructure
**Rejected:** Not reproducible, no versioning, can't scale, hard to collaborate/publish

## Implementation Plan

**10-Day Schedule:**
- Day 1-2: Schema enhancements + RLS policies
- Day 3-4: DVC + Pandera + MLflow + DuckDB pipeline
- Day 5-6: Bayesian ITS (CausalPy) + change point detection
- Day 7-8: ABAB randomization tests + sequential analysis + CENT dashboard
- Day 9: Evidently dashboards + Dagster jobs + export bundles
- Day 10: Wearables OAuth + daily sync + correlation analysis

## Related ADRs

- ADR-001: Hybrid TypeScript + Python Architecture (Epic 4)
- ADR-003: Two-Tier Caching (Epic 5)
- ADR-005: Gemini Embeddings + pgvector (Epic 3)

## References

### Standards & Protocols
- [CENT 2015](https://pubmed.ncbi.nlm.nih.gov/26272792/) - CONSORT Extension for N-of-1 Trials
- [SPIRIT-AI](https://pubmed.ncbi.nlm.nih.gov/32501496/) - Clinical Trial Protocol Extension
- [What Works Clearinghouse SCED Standards](https://ies.ed.gov/ncee/wwc/Document/229)

### Statistical Methods
- [Bayesian ITS with PyMC](https://causalpy.readthedocs.io/en/latest/notebooks/its_pymc.html)
- [CausalImpact (Google BSTS)](https://pypi.org/project/causalimpact/)
- [Synthetic Control Method](https://en.wikipedia.org/wiki/Synthetic_control_method)
- [Randomization Tests for SCED](https://pubmed.ncbi.nlm.nih.gov/18522057/)

### Infrastructure
- [DuckDB for Analytics](https://duckdb.org/science/motherduck/)
- [dbt for Data Transformation](https://docs.getdbt.com/)
- [Dagster for Orchestration](https://docs.dagster.io/)
- [Pandera Schema Validation](https://pandera.readthedocs.io/)
- [Evidently for Drift Detection](https://docs.evidentlyai.com/)
- [MLflow Experiment Tracking](https://mlflow.org/docs/latest/)
- [DVC Data Versioning](https://dvc.org/)

## Approval

**Decision:** Approved
**Date:** 2025-10-26
**Approved by:** Kevy
**Consultation:** Codex MCP (architecture review)

## Status Tracking

- [x] ADR created and approved
- [ ] Schema migrations written (Day 1-2)
- [ ] DVC/MLflow/DuckDB configured (Day 3-4)
- [ ] Bayesian ITS implemented (Day 5-6)
- [ ] SCED tests implemented (Day 7-8)
- [ ] Observability configured (Day 9)
- [ ] Wearables integrated (Day 10)
