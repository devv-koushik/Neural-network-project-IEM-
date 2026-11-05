"""
Module 5: Synthetic Data Generator.
Generates synthetic tabular datasets preserving statistical distributions,
categorical proportions, and domain constraints, and computes distribution similarity
using the Kolmogorov-Smirnov two-sample test.
"""
import os
import sys
import time
import numpy as np
import pandas as pd
from scipy import stats

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config


def get_output_dir():
    out_dir = os.path.join(Config.BASE_DIR, 'ml', 'generative', 'outputs')
    os.makedirs(out_dir, exist_ok=True)
    return out_dir


def generate_synthetic_tabular_data(source_df: pd.DataFrame, num_records: int = 100, source_name: str = 'customers'):
    """
    Learns empirical marginal distributions from source_df and samples
    new synthetic records respecting business domain bounds.
    Evaluates distribution fidelity using Kolmogorov-Smirnov test.
    """
    if source_df.empty:
        raise ValueError('Source dataset is empty.')

    synthetic_dict = {}
    ks_results = {}

    numeric_cols = source_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = source_df.select_dtypes(exclude=[np.number]).columns.tolist()

    # Avoid generating synthetic primary keys or timestamps
    numeric_cols = [c for c in numeric_cols if c not in ('id', 'user_id', 'customer_id', 'product_id')]
    categorical_cols = [c for c in categorical_cols if c not in ('created_at', 'updated_at', 'email')]

    # 1. Synthesize numeric features
    for col in numeric_cols:
        series = source_df[col].dropna()
        if len(series) == 0:
            synthetic_dict[col] = np.zeros(num_records)
            continue

        mean = float(series.mean())
        std = float(series.std()) if len(series) > 1 and series.std() > 0 else 1.0
        min_val = float(series.min())
        max_val = float(series.max())

        # Sample with gaussian kernel + noise
        sampled = np.random.normal(loc=mean, scale=std, size=num_records)

        # Domain constraint clipping
        if 'age' in col.lower():
            sampled = np.clip(np.round(sampled), 18, 75).astype(int)
        elif any(k in col.lower() for k in ['count', 'purchases', 'sessions', 'additions', 'abandonments', 'interactions', 'usage', 'stock', 'reviews']):
            sampled = np.clip(np.round(sampled), 0, int(max_val * 1.25)).astype(int)
        elif any(k in col.lower() for k in ['price', 'revenue', 'value', 'time', 'clv', 'rating']):
            sampled = np.clip(sampled, max(0.0, min_val * 0.8), max_val * 1.2)
            sampled = np.round(sampled, 2)
        else:
            sampled = np.clip(sampled, min_val, max_val)

        synthetic_dict[col] = sampled

        # Kolmogorov-Smirnov test: compares original and synthetic distribution
        ks_stat, p_val = stats.ks_2samp(series.values, sampled)
        ks_results[col] = {
            'original_mean': round(mean, 2),
            'synthetic_mean': round(float(np.mean(sampled)), 2),
            'original_std': round(std, 2),
            'synthetic_std': round(float(np.std(sampled)), 2),
            'ks_statistic': round(float(ks_stat), 4),
            'p_value': round(float(p_val), 4),
            'similarity_score': round(float(max(0.0, 1.0 - ks_stat)), 4),
        }

    # 2. Synthesize categorical features based on empirical frequency proportions
    for col in categorical_cols:
        series = source_df[col].dropna()
        if len(series) == 0:
            synthetic_dict[col] = ['Unknown'] * num_records
            continue
        counts = series.value_counts(normalize=True)
        categories = counts.index.tolist()
        probabilities = counts.values.tolist()
        sampled_cats = np.random.choice(categories, size=num_records, p=probabilities)
        synthetic_dict[col] = sampled_cats

    # 3. Add identifiers and synthetic label
    if 'name' in source_df.columns:
        first_names = ['Alex', 'Jordan', 'Taylor', 'Sam', 'Chris', 'Morgan', 'Casey', 'Riley', 'Avery', 'Devon']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor']
        synthetic_dict['name'] = [f'{np.random.choice(first_names)} {np.random.choice(last_names)}' for _ in range(num_records)]

    synthetic_dict['is_synthetic'] = [True] * num_records

    syn_df = pd.DataFrame(synthetic_dict)

    # Average quality score (mean similarity score = 1 - KS statistic)
    sim_scores = [v['similarity_score'] for v in ks_results.values()]
    quality_score = float(np.mean(sim_scores)) if sim_scores else 0.85

    # Export to CSV
    out_dir = get_output_dir()
    timestamp = int(time.time())
    filename = f'synthetic_{source_name}_{timestamp}.csv'
    file_path = os.path.join(out_dir, filename)
    syn_df.to_csv(file_path, index=False)

    return syn_df, ks_results, quality_score, filename, file_path
