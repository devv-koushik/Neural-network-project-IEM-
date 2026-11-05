"""
Updates the Product records in smartcart.db directly using sqlite3
to use real product images from the visual recognition dataset.
"""
import os
import sqlite3

PRODUCT_IMAGE_MAP = {
    'Aurora Wireless ANC Headphones': '/dataset/Electronics/electronics_001.jpg',
    'Pulse Fitness Smartwatch': '/dataset/Electronics/electronics_002.jpg',
    'Nimbus Merino Wool Sweater': '/dataset/Shirts/shirts_001.jpg',
    'Strato Trail Running Shoes': '/dataset/Shoes/shoes_001.jpg',
    'Voyage Leather Backpack': '/dataset/Bags/bags_001.jpg',
    'Haven Bouclé Accent Chair': '/dataset/Other/other_001.jpg',
    'Haven Boucle Accent Chair': '/dataset/Other/other_001.jpg',
    'Lumen Vitamin C Serum': '/dataset/Other/other_002.jpg',
    'Halo 5G Smartphone': '/dataset/Electronics/electronics_003.jpg',
    'Aperture Mirrorless Camera': '/dataset/Electronics/electronics_005.jpg',
    'Compile 14" Ultrabook': '/dataset/Electronics/electronics_004.jpg',
    'Meridian Polarized Sunglasses': '/dataset/Accessories/accessories_003.jpg',
    'Sequence Pro Controller': '/dataset/Electronics/electronics_006.jpg',
    'Drift Canvas Sneakers': '/dataset/Shoes/shoes_002.jpg',
    'Solace Weighted Blanket': '/dataset/Other/other_005.jpg',
    'Quartz Mineral Sunscreen': '/dataset/Other/other_004.jpg',
    'Alpine Tailored Wool Coat': '/dataset/Shirts/shirts_002.jpg',
}

CATEGORY_FALLBACK_MAP = {
    'Electronics': '/dataset/Electronics/electronics_001.jpg',
    'Shoes': '/dataset/Shoes/shoes_001.jpg',
    'Fashion': '/dataset/Shirts/shirts_001.jpg',
    'Accessories': '/dataset/Accessories/accessories_003.jpg',
    'Home': '/dataset/Other/other_001.jpg',
    'Beauty': '/dataset/Other/other_002.jpg',
}

def update_images():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'smartcart.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('SELECT id, name, category, image_url FROM products')
    rows = cur.fetchall()
    updated = 0
    for pid, name, cat, cur_img in rows:
        img = PRODUCT_IMAGE_MAP.get(name)
        if not img:
            img = CATEGORY_FALLBACK_MAP.get(cat, '/dataset/Other/other_001.jpg')
        cur.execute('UPDATE products SET image_url = ? WHERE id = ?', (img, pid))
        updated += 1
        print(f"Product #{pid} '{name}' -> {img}")
    conn.commit()
    conn.close()
    print(f"\nSuccessfully updated {updated} products in {db_path} with real dataset images.")

if __name__ == '__main__':
    update_images()
