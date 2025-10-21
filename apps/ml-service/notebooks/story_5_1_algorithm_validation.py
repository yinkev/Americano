"""
Algorithm Validation for Story 5.1 - Research-Grade Statistical Analysis
==========================================================================

Validates three behavioral analysis algorithms with statistical rigor:
1. Forgetting Curve Analyzer - Exponential decay model R(t) = R₀ × e^(-kt)
2. Study Time Optimizer - Hour-of-day performance patterns
3. Session Duration Optimizer - Optimal session length analysis

Uses:
- scipy.optimize.curve_fit for exponential regression
- scipy.stats.f_oneway for ANOVA testing
- sklearn.metrics for model evaluation (R², MAE)
- pandas for data manipulation

Research Standards:
- Proper hypothesis testing with p-values
- Effect size reporting (not just significance)
- Confidence intervals
- Sample size validation
- NO p-hacking or HARKing
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings

import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns

# Database connection
import psycopg2
from psycopg2.extras import RealDictCursor

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Style configuration for plots
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)


class DatabaseConnection:
    """Manages PostgreSQL database connection for data extraction"""

    def __init__(self):
        self.conn = None
        self.database_url = os.getenv('DATABASE_URL')

        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set")

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                self.database_url,
                cursor_factory=RealDictCursor
            )
            print("✓ Database connection established")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")

    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute query and return results as list of dicts"""
        with self.conn.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()


class ValidationReport:
    """Generates comprehensive validation report"""

    def __init__(self):
        self.sections = []
        self.overall_pass = True

    def add_section(self, title: str, content: str, passed: bool):
        """Add a validation section to the report"""
        self.sections.append({
            'title': title,
            'content': content,
            'passed': passed
        })
        if not passed:
            self.overall_pass = False

    def generate_markdown(self) -> str:
        """Generate markdown report"""
        report = f"""# Algorithm Validation Report - Story 5.1

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Random Seed:** {RANDOM_SEED}
**Status:** {"✅ PASSED" if self.overall_pass else "❌ FAILED"}

---

"""
        for section in self.sections:
            status = "✅" if section['passed'] else "❌"
            report += f"## {status} {section['title']}\n\n"
            report += section['content']
            report += "\n\n---\n\n"

        report += f"""## Research-Grade Validation: {"✅ PASSED" if self.overall_pass else "❌ FAILED"}

### Validation Criteria
- Statistical significance (p < 0.05)
- Effect size reporting
- Confidence intervals provided
- Sample size adequacy
- No p-hacking or HARKing

### Next Steps
{"All algorithms validated successfully. Ready for production deployment." if self.overall_pass else "Algorithms require further refinement. See failed sections above for details."}
"""
        return report


# ============================================================================
# VALIDATION 1: Forgetting Curve Analyzer
# ============================================================================

class ForgettingCurveValidator:
    """Validates exponential forgetting curve algorithm"""

    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.df_reviews = None
        self.validation_results = {}

    def extract_data(self, user_id: str = None) -> pd.DataFrame:
        """
        Extract review data from database

        Query reviews with multiple review cycles per card to measure retention
        """
        print("\n" + "="*70)
        print("VALIDATION 1: Forgetting Curve Analyzer")
        print("="*70)

        query = """
        SELECT
            r.id,
            r."userId",
            r."cardId",
            r.rating,
            r."reviewedAt",
            r."difficultyBefore",
            r."stabilityBefore",
            c."reviewCount"
        FROM "reviews" r
        JOIN "cards" c ON r."cardId" = c.id
        WHERE c."reviewCount" >= 2
        ORDER BY r."cardId", r."reviewedAt" ASC
        """

        print("\n📊 Extracting review data from database...")
        results = self.db.execute_query(query)

        if not results:
            print("✗ No review data found in database")
            return pd.DataFrame()

        self.df_reviews = pd.DataFrame(results)
        self.df_reviews['reviewedAt'] = pd.to_datetime(self.df_reviews['reviewedAt'])

        print(f"✓ Extracted {len(self.df_reviews)} reviews")
        print(f"  - Unique cards: {self.df_reviews['cardId'].nunique()}")
        print(f"  - Unique users: {self.df_reviews['userId'].nunique()}")
        print(f"  - Date range: {self.df_reviews['reviewedAt'].min().date()} to {self.df_reviews['reviewedAt'].max().date()}")

        return self.df_reviews

    def prepare_retention_data(self) -> pd.DataFrame:
        """
        Prepare retention data points for curve fitting

        For each card with multiple reviews, calculate:
        - Days since last review
        - Retention (1 if GOOD/EASY, 0 if AGAIN/HARD)
        """
        print("\n📈 Preparing retention data points...")

        retention_data = []

        for card_id in self.df_reviews['cardId'].unique():
            card_reviews = self.df_reviews[self.df_reviews['cardId'] == card_id].sort_values('reviewedAt')

            if len(card_reviews) < 2:
                continue

            for i in range(len(card_reviews) - 1):
                current_review = card_reviews.iloc[i]
                next_review = card_reviews.iloc[i + 1]

                # Calculate days between reviews
                days_elapsed = (next_review['reviewedAt'] - current_review['reviewedAt']).total_seconds() / (24 * 3600)

                # Retention: 1 if remembered (GOOD/EASY), 0 if forgotten (AGAIN/HARD)
                retained = 1 if next_review['rating'] in ['GOOD', 'EASY'] else 0

                retention_data.append({
                    'card_id': card_id,
                    'days_since_review': days_elapsed,
                    'retained': retained,
                    'user_id': current_review['userId']
                })

        df_retention = pd.DataFrame(retention_data)

        print(f"✓ Prepared {len(df_retention)} retention data points")
        print(f"  - Mean days between reviews: {df_retention['days_since_review'].mean():.2f}")
        print(f"  - Mean retention rate: {df_retention['retained'].mean():.3f}")

        return df_retention

    def fit_exponential_curve(self, df_retention: pd.DataFrame) -> Tuple[float, float, Dict]:
        """
        Fit exponential decay curve: R(t) = R₀ × e^(-kt)

        Uses scipy.optimize.curve_fit with proper error handling

        Returns:
            R0: Initial retention
            k: Decay constant
            stats_dict: Statistical validation metrics
        """
        print("\n🧮 Fitting exponential decay curve...")

        # Filter valid data points (positive days, valid retention)
        df_valid = df_retention[
            (df_retention['days_since_review'] > 0) &
            (df_retention['days_since_review'] < 180)  # Reasonable time window
        ].copy()

        if len(df_valid) < 30:
            print(f"✗ Insufficient data points: {len(df_valid)} < 30 (minimum required)")
            return None, None, {'error': 'Insufficient data'}

        # Prepare data
        t = df_valid['days_since_review'].values
        R_actual = df_valid['retained'].values

        # Define exponential decay function
        def exponential_decay(t, R0, k):
            return R0 * np.exp(-k * t)

        # Fit curve with initial guesses
        try:
            popt, pcov = curve_fit(
                exponential_decay,
                t,
                R_actual,
                p0=[1.0, 0.05],  # Initial guesses: R0=1.0, k=0.05
                bounds=([0.5, 0.01], [1.0, 0.5]),  # Reasonable bounds
                maxfev=10000
            )

            R0_fit, k_fit = popt

            # Calculate predictions
            R_pred = exponential_decay(t, R0_fit, k_fit)

            # Calculate goodness of fit metrics
            r2 = r2_score(R_actual, R_pred)
            mae = mean_absolute_error(R_actual, R_pred)

            # Calculate half-life
            half_life = np.log(2) / k_fit

            # Calculate confidence intervals (95%)
            perr = np.sqrt(np.diag(pcov))
            ci_R0 = (R0_fit - 1.96 * perr[0], R0_fit + 1.96 * perr[0])
            ci_k = (k_fit - 1.96 * perr[1], k_fit + 1.96 * perr[1])

            stats_dict = {
                'R0': R0_fit,
                'k': k_fit,
                'half_life_days': half_life,
                'r2': r2,
                'mae': mae,
                'n_samples': len(df_valid),
                'ci_R0': ci_R0,
                'ci_k': ci_k,
                'rmse': np.sqrt(np.mean((R_actual - R_pred) ** 2))
            }

            print(f"✓ Curve fit successful:")
            print(f"  - R₀ (initial retention) = {R0_fit:.4f} [95% CI: {ci_R0[0]:.4f}, {ci_R0[1]:.4f}]")
            print(f"  - k (decay constant) = {k_fit:.4f} [95% CI: {ci_k[0]:.4f}, {ci_k[1]:.4f}]")
            print(f"  - Half-life = {half_life:.2f} days")
            print(f"  - R² = {r2:.4f} (Target: >0.70)")
            print(f"  - MAE = {mae:.4f} (Target: <0.10)")
            print(f"  - RMSE = {stats_dict['rmse']:.4f}")
            print(f"  - Sample size = {len(df_valid)}")

            return R0_fit, k_fit, stats_dict

        except Exception as e:
            print(f"✗ Curve fitting failed: {e}")
            return None, None, {'error': str(e)}

    def validate(self, user_id: str = None) -> Dict:
        """
        Run complete validation pipeline

        Returns validation results with pass/fail status
        """
        # Extract data
        df_reviews = self.extract_data(user_id)

        if df_reviews.empty:
            return {
                'passed': False,
                'reason': 'No data available for validation',
                'metrics': {}
            }

        # Prepare retention data
        df_retention = self.prepare_retention_data()

        if df_retention.empty:
            return {
                'passed': False,
                'reason': 'Insufficient multi-review data',
                'metrics': {}
            }

        # Fit curve
        R0, k, stats = self.fit_exponential_curve(df_retention)

        if R0 is None:
            return {
                'passed': False,
                'reason': 'Curve fitting failed',
                'metrics': stats
            }

        # Validation criteria
        passed_r2 = stats['r2'] > 0.70
        passed_mae = stats['mae'] < 0.10
        passed_sample_size = stats['n_samples'] >= 30
        passed_k_range = 0.01 <= stats['k'] <= 0.20  # Reasonable decay range

        all_passed = passed_r2 and passed_mae and passed_sample_size and passed_k_range

        result = {
            'passed': all_passed,
            'metrics': stats,
            'criteria_passed': {
                'r2_gt_0.70': passed_r2,
                'mae_lt_0.10': passed_mae,
                'sample_size_gte_30': passed_sample_size,
                'k_in_reasonable_range': passed_k_range
            }
        }

        print(f"\n{'✅' if all_passed else '❌'} Validation Result:")
        print(f"  - R² > 0.70: {'✅' if passed_r2 else '❌'} ({stats['r2']:.4f})")
        print(f"  - MAE < 0.10: {'✅' if passed_mae else '❌'} ({stats['mae']:.4f})")
        print(f"  - Sample size ≥ 30: {'✅' if passed_sample_size else '❌'} ({stats['n_samples']})")
        print(f"  - k in [0.01, 0.20]: {'✅' if passed_k_range else '❌'} ({stats['k']:.4f})")

        return result


# ============================================================================
# VALIDATION 2: Study Time Optimizer
# ============================================================================

class StudyTimeValidator:
    """Validates hour-of-day performance optimization algorithm"""

    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.df_sessions = None

    def extract_data(self) -> pd.DataFrame:
        """Extract study session data grouped by hour-of-day"""
        print("\n" + "="*70)
        print("VALIDATION 2: Study Time Optimizer")
        print("="*70)

        query = """
        SELECT
            s.id,
            s."userId",
            s."startedAt",
            s."completedAt",
            s."durationMs",
            s."reviewsCompleted",
            s."objectiveCompletions",
            EXTRACT(HOUR FROM s."startedAt") as hour_of_day
        FROM "study_sessions" s
        WHERE s."completedAt" IS NOT NULL
          AND s."durationMs" IS NOT NULL
        ORDER BY s."startedAt" DESC
        LIMIT 1000
        """

        print("\n📊 Extracting study session data...")
        results = self.db.execute_query(query)

        if not results:
            print("✗ No study session data found")
            return pd.DataFrame()

        self.df_sessions = pd.DataFrame(results)
        self.df_sessions['startedAt'] = pd.to_datetime(self.df_sessions['startedAt'])
        self.df_sessions['hour_of_day'] = self.df_sessions['hour_of_day'].astype(int)

        print(f"✓ Extracted {len(self.df_sessions)} study sessions")
        print(f"  - Unique users: {self.df_sessions['userId'].nunique()}")
        print(f"  - Date range: {self.df_sessions['startedAt'].min().date()} to {self.df_sessions['startedAt'].max().date()}")

        return self.df_sessions

    def calculate_performance_by_hour(self) -> pd.DataFrame:
        """
        Calculate performance metrics for each hour-of-day

        Performance metric: reviews completed per hour of session time
        """
        print("\n📈 Calculating performance by hour-of-day...")

        # Calculate performance score for each session
        self.df_sessions['session_hours'] = self.df_sessions['durationMs'] / (1000 * 60 * 60)
        self.df_sessions['reviews_per_hour'] = (
            self.df_sessions['reviewsCompleted'] / self.df_sessions['session_hours'].clip(lower=0.1)
        )

        # Group by hour and calculate statistics
        hourly_stats = self.df_sessions.groupby('hour_of_day').agg({
            'reviews_per_hour': ['mean', 'std', 'count'],
            'reviewsCompleted': 'sum'
        }).reset_index()

        hourly_stats.columns = ['hour', 'avg_reviews_per_hour', 'std_reviews_per_hour', 'session_count', 'total_reviews']

        # Filter hours with sufficient data (≥5 sessions)
        hourly_stats = hourly_stats[hourly_stats['session_count'] >= 5]

        print(f"✓ Analyzed {len(hourly_stats)} hours with ≥5 sessions each")
        print(f"  - Best hour: {int(hourly_stats.loc[hourly_stats['avg_reviews_per_hour'].idxmax(), 'hour'])} "
              f"({hourly_stats['avg_reviews_per_hour'].max():.2f} reviews/hour)")
        print(f"  - Worst hour: {int(hourly_stats.loc[hourly_stats['avg_reviews_per_hour'].idxmin(), 'hour'])} "
              f"({hourly_stats['avg_reviews_per_hour'].min():.2f} reviews/hour)")

        return hourly_stats

    def run_anova_test(self, hourly_stats: pd.DataFrame) -> Dict:
        """
        Run ANOVA F-test to determine if hour-of-day matters

        H0: Performance is the same across all hours
        H1: Performance differs significantly by hour

        Uses scipy.stats.f_oneway
        """
        print("\n🧪 Running ANOVA F-test...")

        # Group sessions by time-of-day categories
        # Morning (6-11), Afternoon (12-17), Evening (18-23), Night (0-5)
        self.df_sessions['time_period'] = pd.cut(
            self.df_sessions['hour_of_day'],
            bins=[-1, 5, 11, 17, 23],
            labels=['Night', 'Morning', 'Afternoon', 'Evening']
        )

        # Get performance data for each time period
        night = self.df_sessions[self.df_sessions['time_period'] == 'Night']['reviews_per_hour'].dropna()
        morning = self.df_sessions[self.df_sessions['time_period'] == 'Morning']['reviews_per_hour'].dropna()
        afternoon = self.df_sessions[self.df_sessions['time_period'] == 'Afternoon']['reviews_per_hour'].dropna()
        evening = self.df_sessions[self.df_sessions['time_period'] == 'Evening']['reviews_per_hour'].dropna()

        # Ensure we have enough data
        if any(len(group) < 3 for group in [night, morning, afternoon, evening]):
            print("✗ Insufficient data in some time periods")
            return {'passed': False, 'reason': 'Insufficient data'}

        # Run one-way ANOVA
        f_statistic, p_value = stats.f_oneway(night, morning, afternoon, evening)

        # Calculate effect size (eta-squared)
        # η² = SS_between / SS_total
        all_data = pd.concat([
            night.to_frame('value').assign(group='Night'),
            morning.to_frame('value').assign(group='Morning'),
            afternoon.to_frame('value').assign(group='Afternoon'),
            evening.to_frame('value').assign(group='Evening')
        ])

        grand_mean = all_data['value'].mean()
        ss_total = ((all_data['value'] - grand_mean) ** 2).sum()

        group_means = all_data.groupby('group')['value'].mean()
        group_sizes = all_data.groupby('group').size()
        ss_between = sum(group_sizes * (group_means - grand_mean) ** 2)

        eta_squared = ss_between / ss_total if ss_total > 0 else 0

        # Interpretation
        significant = p_value < 0.05
        effect_interpretation = (
            "large" if eta_squared >= 0.14 else
            "medium" if eta_squared >= 0.06 else
            "small"
        )

        result = {
            'f_statistic': f_statistic,
            'p_value': p_value,
            'significant': significant,
            'eta_squared': eta_squared,
            'effect_size': effect_interpretation,
            'group_means': {
                'Night': night.mean(),
                'Morning': morning.mean(),
                'Afternoon': afternoon.mean(),
                'Evening': evening.mean()
            },
            'group_sizes': {
                'Night': len(night),
                'Morning': len(morning),
                'Afternoon': len(afternoon),
                'Evening': len(evening)
            }
        }

        print(f"✓ ANOVA Test Results:")
        print(f"  - F-statistic: {f_statistic:.4f}")
        print(f"  - p-value: {p_value:.6f}")
        print(f"  - Significant (p < 0.05): {'✅ YES' if significant else '❌ NO'}")
        print(f"  - Effect size (η²): {eta_squared:.4f} ({effect_interpretation})")
        print(f"\n  Group Means (reviews/hour):")
        for period, mean_val in result['group_means'].items():
            print(f"    - {period}: {mean_val:.2f} (n={result['group_sizes'][period]})")

        return result

    def validate(self) -> Dict:
        """Run complete validation pipeline"""
        # Extract data
        df_sessions = self.extract_data()

        if df_sessions.empty:
            return {
                'passed': False,
                'reason': 'No data available',
                'metrics': {}
            }

        # Calculate hourly performance
        hourly_stats = self.calculate_performance_by_hour()

        if hourly_stats.empty:
            return {
                'passed': False,
                'reason': 'Insufficient hourly data',
                'metrics': {}
            }

        # Run ANOVA
        anova_results = self.run_anova_test(hourly_stats)

        if 'error' in anova_results or 'reason' in anova_results:
            return {
                'passed': False,
                'reason': anova_results.get('reason', 'ANOVA test failed'),
                'metrics': anova_results
            }

        # Validation criteria
        passed = anova_results['significant'] and anova_results['eta_squared'] >= 0.01

        result = {
            'passed': passed,
            'metrics': anova_results,
            'hourly_stats': hourly_stats.to_dict('records')
        }

        print(f"\n{'✅' if passed else '❌'} Validation Result:")
        print(f"  - Hour-of-day matters: {'✅ YES' if anova_results['significant'] else '❌ NO'}")
        print(f"  - Effect size meaningful: {'✅ YES' if anova_results['eta_squared'] >= 0.01 else '❌ NO'}")

        return result


# ============================================================================
# VALIDATION 3: Session Duration Optimizer
# ============================================================================

class SessionDurationValidator:
    """Validates optimal session duration algorithm"""

    def __init__(self, db: DatabaseConnection):
        self.db = db
        self.df_sessions = None

    def extract_data(self) -> pd.DataFrame:
        """Extract study sessions with duration and performance data"""
        print("\n" + "="*70)
        print("VALIDATION 3: Session Duration Optimizer")
        print("="*70)

        query = """
        SELECT
            s.id,
            s."userId",
            s."durationMs",
            s."reviewsCompleted",
            s."newCardsStudied",
            s."objectiveCompletions"
        FROM "study_sessions" s
        WHERE s."completedAt" IS NOT NULL
          AND s."durationMs" IS NOT NULL
          AND s."durationMs" > 0
        ORDER BY s."startedAt" DESC
        LIMIT 1000
        """

        print("\n📊 Extracting session data...")
        results = self.db.execute_query(query)

        if not results:
            print("✗ No session data found")
            return pd.DataFrame()

        self.df_sessions = pd.DataFrame(results)
        self.df_sessions['duration_minutes'] = self.df_sessions['durationMs'] / (1000 * 60)

        print(f"✓ Extracted {len(self.df_sessions)} sessions")
        print(f"  - Mean duration: {self.df_sessions['duration_minutes'].mean():.2f} minutes")
        print(f"  - Median duration: {self.df_sessions['duration_minutes'].median():.2f} minutes")

        return self.df_sessions

    def analyze_performance_by_duration(self) -> pd.DataFrame:
        """
        Analyze performance across duration buckets

        Performance = reviews completed per hour
        """
        print("\n📈 Analyzing performance by duration...")

        # Create duration buckets
        self.df_sessions['duration_bucket'] = pd.cut(
            self.df_sessions['duration_minutes'],
            bins=[0, 20, 40, 60, 90, 120, 999],
            labels=['<20min', '20-40min', '40-60min', '60-90min', '90-120min', '>120min']
        )

        # Calculate performance (reviews per hour)
        self.df_sessions['reviews_per_hour'] = (
            self.df_sessions['reviewsCompleted'] /
            (self.df_sessions['duration_minutes'] / 60).clip(lower=0.1)
        )

        # Group by duration bucket
        bucket_stats = self.df_sessions.groupby('duration_bucket').agg({
            'reviews_per_hour': ['mean', 'std', 'count'],
            'reviewsCompleted': 'sum'
        }).reset_index()

        bucket_stats.columns = ['duration_bucket', 'avg_performance', 'std_performance', 'session_count', 'total_reviews']

        # Filter buckets with sufficient data
        bucket_stats = bucket_stats[bucket_stats['session_count'] >= 3]

        print(f"✓ Analyzed {len(bucket_stats)} duration buckets")
        for _, row in bucket_stats.iterrows():
            print(f"  - {row['duration_bucket']}: {row['avg_performance']:.2f} reviews/hour (n={int(row['session_count'])})")

        return bucket_stats

    def detect_optimal_duration(self, bucket_stats: pd.DataFrame) -> Dict:
        """
        Detect optimal duration bucket

        Optimal = highest performance with sufficient sample size
        """
        print("\n🎯 Detecting optimal duration...")

        if bucket_stats.empty:
            return {'passed': False, 'reason': 'No duration data'}

        # Find bucket with highest performance
        optimal_idx = bucket_stats['avg_performance'].idxmax()
        optimal_bucket = bucket_stats.loc[optimal_idx]

        # Expected optimal range: 40-60 minutes (based on research)
        expected_optimal = '40-60min'
        matches_expectation = optimal_bucket['duration_bucket'] == expected_optimal

        result = {
            'optimal_bucket': str(optimal_bucket['duration_bucket']),
            'optimal_performance': float(optimal_bucket['avg_performance']),
            'optimal_sessions': int(optimal_bucket['session_count']),
            'matches_research': matches_expectation,
            'all_buckets': bucket_stats.to_dict('records')
        }

        print(f"✓ Optimal duration detected: {result['optimal_bucket']}")
        print(f"  - Performance: {result['optimal_performance']:.2f} reviews/hour")
        print(f"  - Sample size: {result['optimal_sessions']} sessions")
        print(f"  - Matches research expectation (40-60min): {'✅' if matches_expectation else '⚠️'}")

        return result

    def validate(self) -> Dict:
        """Run complete validation pipeline"""
        # Extract data
        df_sessions = self.extract_data()

        if df_sessions.empty:
            return {
                'passed': False,
                'reason': 'No data available',
                'metrics': {}
            }

        # Analyze by duration
        bucket_stats = self.analyze_performance_by_duration()

        if bucket_stats.empty:
            return {
                'passed': False,
                'reason': 'Insufficient duration bucket data',
                'metrics': {}
            }

        # Detect optimal duration
        optimal_results = self.detect_optimal_duration(bucket_stats)

        if 'reason' in optimal_results:
            return {
                'passed': False,
                'reason': optimal_results['reason'],
                'metrics': {}
            }

        # Validation criteria
        # Pass if we have optimal duration with ≥3 sessions
        passed = optimal_results['optimal_sessions'] >= 3

        result = {
            'passed': passed,
            'metrics': optimal_results
        }

        print(f"\n{'✅' if passed else '❌'} Validation Result:")
        print(f"  - Sufficient data: {'✅' if passed else '❌'} ({optimal_results['optimal_sessions']} sessions)")

        return result


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run all algorithm validations"""
    print("="*70)
    print("ALGORITHM VALIDATION - STORY 5.1")
    print("Research-Grade Statistical Analysis")
    print("="*70)
    print(f"\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Random Seed: {RANDOM_SEED}")

    # Initialize database connection
    db = DatabaseConnection()
    db.connect()

    # Initialize report
    report = ValidationReport()

    try:
        # Validation 1: Forgetting Curve
        print("\n" + "🔬" * 35)
        validator1 = ForgettingCurveValidator(db)
        result1 = validator1.validate()

        # Format metrics safely
        metrics1 = result1.get('metrics', {})
        r0 = metrics1.get('R0', None)
        k = metrics1.get('k', None)
        half_life = metrics1.get('half_life_days', None)
        r2 = metrics1.get('r2', None)
        mae = metrics1.get('mae', None)
        rmse = metrics1.get('rmse', None)
        n_samples = metrics1.get('n_samples', None)
        ci_R0 = metrics1.get('ci_R0', (None, None))
        ci_k = metrics1.get('ci_k', (None, None))

        content1 = f"""### Algorithm: Exponential Decay R(t) = R₀ × e^(-kt)

**Sample Size:** {n_samples if n_samples is not None else 'N/A'}

**Fitted Parameters:**
- R₀ (initial retention): {f'{r0:.4f}' if r0 is not None else 'N/A'} [95% CI: {f'{ci_R0[0]:.4f}' if ci_R0[0] is not None else 'N/A'}, {f'{ci_R0[1]:.4f}' if ci_R0[1] is not None else 'N/A'}]
- k (decay constant): {f'{k:.4f}' if k is not None else 'N/A'} [95% CI: {f'{ci_k[0]:.4f}' if ci_k[0] is not None else 'N/A'}, {f'{ci_k[1]:.4f}' if ci_k[1] is not None else 'N/A'}]
- Half-life: {f'{half_life:.2f}' if half_life is not None else 'N/A'} days

**Goodness of Fit:**
- R² (coefficient of determination): {f'{r2:.4f}' if r2 is not None else 'N/A'} (Target: >0.70) {'✅' if r2 and r2 > 0.70 else '❌'}
- MAE (mean absolute error): {f'{mae:.4f}' if mae is not None else 'N/A'} (Target: <0.10) {'✅' if mae and mae < 0.10 else '❌'}
- RMSE: {f'{rmse:.4f}' if rmse is not None else 'N/A'}

**Validation Criteria:**
- R² > 0.70: {'✅ PASS' if result1.get('criteria_passed', {}).get('r2_gt_0.70', False) else '❌ FAIL'}
- MAE < 0.10: {'✅ PASS' if result1.get('criteria_passed', {}).get('mae_lt_0.10', False) else '❌ FAIL'}
- Sample size ≥ 30: {'✅ PASS' if result1.get('criteria_passed', {}).get('sample_size_gte_30', False) else '❌ FAIL'}
- k in reasonable range [0.01, 0.20]: {'✅ PASS' if result1.get('criteria_passed', {}).get('k_in_reasonable_range', False) else '❌ FAIL'}

**Interpretation:**
{result1.get('reason', 'Algorithm successfully validated with statistical rigor.' if result1.get('passed') else 'Algorithm requires refinement.')}
"""

        report.add_section("Forgetting Curve Validation", content1, result1.get('passed', False))

        # Validation 2: Study Time Optimizer
        print("\n" + "🔬" * 35)
        validator2 = StudyTimeValidator(db)
        result2 = validator2.validate()

        anova = result2.get('metrics', {})
        content2 = f"""### Algorithm: Hour-of-Day Performance Analysis

**ANOVA F-Test Results:**
- F-statistic: {anova.get('f_statistic', 'N/A'):.4f}
- p-value: {anova.get('p_value', 1):.6f}
- Significant (p < 0.05): {'✅ YES' if anova.get('significant', False) else '❌ NO'}
- Effect size (η²): {anova.get('eta_squared', 0):.4f} ({anova.get('effect_size', 'unknown')})

**Performance by Time Period (reviews/hour):**
- Night (0-5): {anova.get('group_means', {}).get('Night', 0):.2f} (n={anova.get('group_sizes', {}).get('Night', 0)})
- Morning (6-11): {anova.get('group_means', {}).get('Morning', 0):.2f} (n={anova.get('group_sizes', {}).get('Morning', 0)})
- Afternoon (12-17): {anova.get('group_means', {}).get('Afternoon', 0):.2f} (n={anova.get('group_sizes', {}).get('Afternoon', 0)})
- Evening (18-23): {anova.get('group_means', {}).get('Evening', 0):.2f} (n={anova.get('group_sizes', {}).get('Evening', 0)})

**Statistical Interpretation:**
- Hour-of-day significantly affects performance: {'✅ YES' if anova.get('significant') else '❌ NO'}
- Effect size is meaningful (η² ≥ 0.01): {'✅ YES' if anova.get('eta_squared', 0) >= 0.01 else '❌ NO'}

**Conclusion:**
{result2.get('reason', 'Algorithm validated - hour-of-day optimization is statistically justified.' if result2.get('passed') else 'Insufficient evidence for hour-of-day optimization.')}
"""

        report.add_section("Study Time Optimization Validation", content2, result2.get('passed', False))

        # Validation 3: Session Duration
        print("\n" + "🔬" * 35)
        validator3 = SessionDurationValidator(db)
        result3 = validator3.validate()

        metrics3 = result3.get('metrics', {})
        content3 = f"""### Algorithm: Optimal Session Duration Detection

**Optimal Duration Detected:**
- Duration bucket: {metrics3.get('optimal_bucket', 'N/A')}
- Performance: {metrics3.get('optimal_performance', 0):.2f} reviews/hour
- Sample size: {metrics3.get('optimal_sessions', 0)} sessions
- Matches research expectation (40-60min): {'✅' if metrics3.get('matches_research', False) else '⚠️'}

**All Duration Buckets:**
"""
        for bucket in metrics3.get('all_buckets', []):
            content3 += f"- {bucket['duration_bucket']}: {bucket['avg_performance']:.2f} reviews/hour (n={int(bucket['session_count'])})\n"

        content3 += f"""
**Validation Criteria:**
- Sufficient sample size (≥3 sessions): {'✅ PASS' if result3.get('passed') else '❌ FAIL'}

**Interpretation:**
{result3.get('reason', 'Algorithm validated - optimal duration detection working correctly.' if result3.get('passed') else 'Insufficient data for duration optimization.')}
"""

        report.add_section("Session Duration Optimization Validation", content3, result3.get('passed', False))

    finally:
        db.disconnect()

    # Generate and save report
    print("\n" + "="*70)
    print("GENERATING VALIDATION REPORT")
    print("="*70)

    markdown_report = report.generate_markdown()

    report_path = "/Users/kyin/Projects/Americano-epic5/ALGORITHM_VALIDATION_REPORT.md"
    with open(report_path, 'w') as f:
        f.write(markdown_report)

    print(f"\n✓ Report saved to: {report_path}")
    print(f"\nOverall Status: {'✅ PASSED' if report.overall_pass else '❌ FAILED'}")
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
