"""
Generates a realistic synthetic e-commerce customer dataset for training the
purchase and churn models.

Run:
    python ml/data/generate_dataset.py

Produces:
    backend/ml/data/ecommerce_customers.csv

Design notes
------------
- Features are sampled from distributions that resemble real customer
  behavior (e.g. right-skewed browsing time, Poisson-like session counts).
- Both targets (purchase, churn) are generated from a weighted linear
  combination of the *raw* feature values passed through a sigmoid, with
  Gaussian noise added to the logit. This keeps the relationship
  realistic and directionally sensible (e.g. more cart abandonment lowers
  purchase odds, more days since last purchase raises churn odds) without
  making the classes trivially/perfectly separable.
- A random label-flip is additionally applied to a small percentage of
  rows to simulate real-world label noise, which keeps achievable model
  accuracy in a believable ~80-90% range rather than 99-100%.
"""
import os
import sys
import numpy as np
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

RANDOM_SEED = 42
N_ROWS = 8000
LABEL_NOISE_RATE = 0.03  # fraction of rows whose label gets randomly flipped

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'ecommerce_customers.csv')


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate_raw_features(n_rows: int, seed: int):
    """Generates just the feature columns (no targets) using the exact same
    distributions as the training dataset. Shared with database/seed.py so
    that seeded demo customers are drawn from the SAME distribution the
    models were trained on — otherwise seeded customers would sit far
    outside the training data's range and saturate the model's predictions
    at the extremes.
    """
    rng = np.random.default_rng(seed)

    age = rng.integers(18, 70, size=n_rows)
    gender = rng.choice(['Female', 'Male', 'Other'], size=n_rows, p=[0.48, 0.48, 0.04])
    device_type = rng.choice(['Mobile', 'Desktop', 'Tablet'], size=n_rows, p=[0.55, 0.35, 0.10])

    browsing_time = np.clip(rng.gamma(shape=2.2, scale=8, size=n_rows), 0, 180)
    pages_viewed = np.clip(rng.poisson(lam=7, size=n_rows), 0, 60)
    previous_purchases = np.clip(rng.negative_binomial(3, 0.35, size=n_rows), 0, 60)
    average_order_value = np.clip(rng.gamma(shape=2.5, scale=35, size=n_rows), 5, 2000)
    number_of_sessions = np.clip(rng.poisson(lam=6, size=n_rows), 0, 80)
    cart_additions = np.clip(rng.poisson(lam=4, size=n_rows), 0, 40)
    cart_abandonments = np.array([rng.integers(0, c + 1) if c > 0 else 0 for c in cart_additions])
    days_since_last_purchase = np.clip(rng.exponential(scale=35, size=n_rows), 0, 365).astype(int)
    customer_lifetime_value = previous_purchases * average_order_value * rng.uniform(0.6, 1.3, size=n_rows) + rng.normal(0, 50, n_rows)
    customer_lifetime_value = np.clip(customer_lifetime_value, 0, None)
    discount_usage = np.clip(rng.poisson(lam=1.3, size=n_rows), 0, 15)
    support_interactions = np.clip(rng.poisson(lam=0.8, size=n_rows), 0, 12)

    return pd.DataFrame({
        'Age': age,
        'Gender': gender,
        'Device_Type': device_type,
        'Browsing_Time': np.round(browsing_time, 1),
        'Pages_Viewed': pages_viewed,
        'Previous_Purchases': previous_purchases,
        'Average_Order_Value': np.round(average_order_value, 2),
        'Number_of_Sessions': number_of_sessions,
        'Cart_Additions': cart_additions,
        'Cart_Abandonments': cart_abandonments,
        'Days_Since_Last_Purchase': days_since_last_purchase,
        'Customer_Lifetime_Value': np.round(customer_lifetime_value, 2),
        'Discount_Usage': discount_usage,
        'Support_Interactions': support_interactions,
    })


def generate_dataset(n_rows=N_ROWS, seed=RANDOM_SEED):
    rng = np.random.default_rng(seed)
    features = generate_raw_features(n_rows, seed)

    age = features['Age'].values
    browsing_time = features['Browsing_Time'].values
    pages_viewed = features['Pages_Viewed'].values
    previous_purchases = features['Previous_Purchases'].values
    average_order_value = features['Average_Order_Value'].values
    number_of_sessions = features['Number_of_Sessions'].values
    cart_additions = features['Cart_Additions'].values
    cart_abandonments = features['Cart_Abandonments'].values
    days_since_last_purchase = features['Days_Since_Last_Purchase'].values
    customer_lifetime_value = features['Customer_Lifetime_Value'].values
    discount_usage = features['Discount_Usage'].values
    support_interactions = features['Support_Interactions'].values

    # ---------------- Normalize features onto comparable ~[0,1] scales for the logit ----------------
    def norm(arr, cap):
        return np.clip(arr / cap, 0, 1)

    n_browsing = norm(browsing_time, 90)
    n_pages = norm(pages_viewed, 25)
    n_sessions = norm(number_of_sessions, 20)
    n_prev_purchases = norm(previous_purchases, 25)
    n_aov = norm(average_order_value, 400)
    n_cart_adds = norm(cart_additions, 15)
    n_cart_abandon_rate = np.divide(cart_abandonments, np.maximum(cart_additions, 1))
    n_days_since = norm(days_since_last_purchase, 120)
    n_clv = norm(customer_lifetime_value, 3000)
    n_discount = norm(discount_usage, 8)
    n_support = norm(support_interactions, 8)

    # ---------------- PURCHASE target ----------------
    purchase_logit = (
        -1.6
        + 4.0 * n_browsing
        + 2.4 * n_pages
        + 2.9 * n_sessions
        + 3.6 * n_prev_purchases
        + 1.3 * n_aov
        + 2.7 * n_cart_adds
        - 4.4 * n_cart_abandon_rate
        - 1.9 * n_days_since
        + 1.2 * n_discount
        + 0.9 * n_clv
    )
    purchase_logit += rng.normal(0, 0.75, n_rows)  # noise keeps it non-trivial (not perfectly separable)
    purchase_prob = sigmoid(purchase_logit)
    purchase = (rng.uniform(0, 1, n_rows) < purchase_prob).astype(int)

    # ---------------- CHURN target ----------------
    churn_logit = (
        -1.9
        + 4.7 * n_days_since
        - 3.7 * n_prev_purchases
        + 2.5 * n_cart_abandon_rate
        - 2.2 * n_sessions
        - 1.5 * n_browsing
        + 1.7 * n_support
        - 0.7 * n_discount
        - 0.9 * n_clv
    )
    churn_logit += rng.normal(0, 0.75, n_rows)
    churn_prob = sigmoid(churn_logit)
    churn = (rng.uniform(0, 1, n_rows) < churn_prob).astype(int)

    # ---------------- Inject label noise ----------------
    flip_mask_purchase = rng.uniform(0, 1, n_rows) < LABEL_NOISE_RATE
    purchase = np.where(flip_mask_purchase, 1 - purchase, purchase)
    flip_mask_churn = rng.uniform(0, 1, n_rows) < LABEL_NOISE_RATE
    churn = np.where(flip_mask_churn, 1 - churn, churn)

    df = features.copy()
    df['purchase'] = purchase
    df['churn'] = churn
    return df


if __name__ == '__main__':
    df = generate_dataset()
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f'Generated {len(df)} rows -> {OUTPUT_PATH}')
    print('\nClass balance:')
    print('  purchase=1 rate:', round(df['purchase'].mean(), 3))
    print('  churn=1 rate:   ', round(df['churn'].mean(), 3))
    print('\nPreview:')
    print(df.head())
