"""
Downloads and organizes a real product image dataset across 6 categories:
Shoes, Shirts, Electronics, Accessories, Bags, Other.

All images are authentic product photographs sourced from Unsplash (Unsplash License:
free to use for commercial and non-commercial purposes, no attribution required).

Performs:
  - MD5 hash verification to guarantee no duplicate images exist across splits
  - Image integrity verification via PIL
  - Stratified 70/15/15 split into train/, val/, and test/
  - Manifest generation with licensing and class statistics
"""
import os
import sys
import json
import hashlib
import urllib.request
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config

DATASET_ROOT = os.path.join(Config.BASE_DIR, 'ml', 'visual', 'dataset')

CATEGORIES_URLS = {
    'Shoes': [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400',
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400',
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400',
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400',
        'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
        'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400',
        'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=400',
        'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400',
        'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=400',
        'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400',
    ],
    'Shirts': [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400',
        'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400',
        'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400',
        'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=400',
        'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400',
        'https://images.unsplash.com/photo-1622445268462-32a3ece04586?w=400',
        'https://images.unsplash.com/photo-1618354691229-88d47f285158?w=400',
    ],
    'Electronics': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400',
        'https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=400',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    ],
    'Accessories': [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400',
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400',
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
        'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400',
        'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
        'https://images.unsplash.com/photo-1611591475817-f584e0c3f5ea?w=400',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
        'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400',
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
        'https://images.unsplash.com/photo-1620656798579-1984d9e87dfa?w=400',
    ],
    'Bags': [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
        'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=400',
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
        'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400',
        'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400',
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400',
        'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
    ],
    'Other': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400',
        'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=400',
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400',
        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400',
        'https://images.unsplash.com/photo-1580481077195-c328a37db71a?w=400',
    ],
}


def download_and_prepare_dataset():
    print('=== Downloading Real Product Images Dataset ===')
    seen_hashes = set()
    category_images = {c: [] for c in CATEGORIES_URLS}

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmartCartAI/1.0'}

    for cat, urls in CATEGORIES_URLS.items():
        print(f'\nProcessing {cat} ({len(urls)} candidates)...')
        cat_dir = os.path.join(DATASET_ROOT, 'raw', cat)
        os.makedirs(cat_dir, exist_ok=True)

        idx = 0
        for url in urls:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=12) as response:
                    raw_data = response.read()

                # Verify non-empty
                if len(raw_data) < 2000:
                    continue

                # Hash check for duplicates
                img_hash = hashlib.md5(raw_data).hexdigest()
                if img_hash in seen_hashes:
                    continue
                seen_hashes.add(img_hash)

                # Validate image using PIL
                raw_path = os.path.join(cat_dir, f'temp_{idx}.jpg')
                with open(raw_path, 'wb') as f:
                    f.write(raw_data)

                with Image.open(raw_path) as img:
                    img.verify()

                # Reopen to convert & resize
                with Image.open(raw_path) as img:
                    img_rgb = img.convert('RGB')
                    final_path = os.path.join(cat_dir, f'{cat.lower()}_{idx+1:03d}.jpg')
                    img_rgb.save(final_path, 'JPEG', quality=95)

                if os.path.exists(raw_path) and raw_path != final_path:
                    os.remove(raw_path)

                category_images[cat].append(final_path)
                idx += 1
                print(f'  [OK] Saved {cat} #{idx}')
            except Exception as e:
                print(f'  [SKIP] Error downloading {url[:45]}...: {e}')

    # Now split into train (70%), val (15%), test (15%)
    splits = {'train': {}, 'val': {}, 'test': {}}
    for s in splits:
        for c in CATEGORIES_URLS:
            os.makedirs(os.path.join(DATASET_ROOT, s, c), exist_ok=True)

    manifest = {
        'dataset_name': 'SmartCart Real E-Commerce Product Image Dataset',
        'license': 'Unsplash License (free for commercial and personal use)',
        'categories': list(CATEGORIES_URLS.keys()),
        'total_images': 0,
        'splits': {},
    }

    for cat, paths in category_images.items():
        n = len(paths)
        if n == 0:
            continue
        n_train = max(1, int(round(n * 0.70)))
        n_val = max(1, int(round(n * 0.15)))
        train_paths = paths[:n_train]
        val_paths = paths[n_train:n_train + n_val]
        test_paths = paths[n_train + n_val:]
        if len(test_paths) == 0 and len(val_paths) > 1:
            test_paths = [val_paths.pop()]

        for p in train_paths:
            dst = os.path.join(DATASET_ROOT, 'train', cat, os.path.basename(p))
            with open(p, 'rb') as src, open(dst, 'wb') as target:
                target.write(src.read())

        for p in val_paths:
            dst = os.path.join(DATASET_ROOT, 'val', cat, os.path.basename(p))
            with open(p, 'rb') as src, open(dst, 'wb') as target:
                target.write(src.read())

        for p in test_paths:
            dst = os.path.join(DATASET_ROOT, 'test', cat, os.path.basename(p))
            with open(p, 'rb') as src, open(dst, 'wb') as target:
                target.write(src.read())

        manifest['splits'][cat] = {
            'train': len(train_paths),
            'val': len(val_paths),
            'test': len(test_paths),
            'total': n,
        }
        manifest['total_images'] += n
        print(f'{cat}: {len(train_paths)} train, {len(val_paths)} val, {len(test_paths)} test')

    manifest_path = os.path.join(DATASET_ROOT, 'dataset_manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f'\nDataset downloaded and organized. Manifest saved to {manifest_path}')
    return manifest


if __name__ == '__main__':
    download_and_prepare_dataset()
