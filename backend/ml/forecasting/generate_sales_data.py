"""
Module 4: Historical Sales Dataset Generator.
Generates 730 days (2 years) of daily sales records with realistic seasonality,
trends, day-of-week cycles, and promotional spikes for e-commerce products.
"""
import os
import sys
import math
import random
import datetime
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config

PRODUCTS = [
    {'id': 1, 'name': 'Premium Wireless Headphones', 'category': 'Electronics', 'base_qty': 18, 'price': 199.99},
    {'id': 2, 'name': 'Ergonomic Office Chair', 'category': 'Home', 'base_qty': 7, 'price': 289.00},
    {'id': 3, 'name': 'Minimalist Leather Watch', 'category': 'Accessories', 'base_qty': 12, 'price': 149.50},
    {'id': 4, 'name': 'Organic Cotton T-Shirt', 'category': 'Fashion', 'base_qty': 35, 'price': 34.00},
    {'id': 5, 'name': 'Smart Fitness Tracker', 'category': 'Electronics', 'base_qty': 22, 'price': 89.99},
    {'id': 6, 'name': 'Noise Cancelling Earbuds', 'category': 'Electronics', 'base_qty': 25, 'price': 129.00},
    {'id': 7, 'name': 'Canvas Travel Backpack', 'category': 'Accessories', 'base_qty': 15, 'price': 79.00},
    {'id': 8, 'name': 'Ultra Running Shoes', 'category': 'Shoes', 'base_qty': 20, 'price': 119.00},
]


def generate_historical_sales(days=730):
    random.seed(42)
    start_date = datetime.date(2024, 11, 1) - datetime.timedelta(days=days)
    records = []

    for d in range(days):
        current_date = start_date + datetime.timedelta(days=d)
        day_of_week = current_date.weekday()  # 0=Mon, 6=Sun
        day_of_year = current_date.timetuple().tm_yday

        # Weekly cycle: Fri/Sat/Sun have +25% to +45% sales
        weekly_factor = 1.35 if day_of_week in [4, 5, 6] else 0.92

        # Yearly seasonality: Holiday season surge (Nov/Dec)
        is_holiday_season = (current_date.month == 11 and current_date.day >= 20) or (current_date.month == 12 and current_date.day <= 25)
        holiday_factor = 1.75 if is_holiday_season else 1.0

        # Long term slight growth trend (+15% per year)
        trend_factor = 1.0 + (d / days) * 0.25

        for prod in PRODUCTS:
            base = prod['base_qty']
            noise = random.gauss(0, base * 0.15)
            # Periodic monthly payday boost (1st and 15th)
            payday_boost = 1.2 if current_date.day in [1, 2, 15, 16] else 1.0

            qty = max(1, int(round((base * weekly_factor * holiday_factor * trend_factor * payday_boost) + noise)))
            revenue = round(qty * prod['price'], 2)

            records.append({
                'date': current_date.isoformat(),
                'product_id': prod['id'],
                'product_name': prod['name'],
                'category': prod['category'],
                'quantity_sold': qty,
                'revenue': revenue,
            })

    df = pd.DataFrame(records)
    out_dir = os.path.join(Config.BASE_DIR, 'ml', 'forecasting')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'sales_data.csv')
    df.to_csv(out_path, index=False)
    print(f'Generated {len(df)} sales records across {len(PRODUCTS)} products.')
    print(f'Date range: {df["date"].min()} to {df["date"].max()}')
    print(f'Saved to {out_path}')
    return df


if __name__ == '__main__':
    generate_historical_sales(days=730)
