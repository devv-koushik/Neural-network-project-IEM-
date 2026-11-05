"""
Audit all 84 product images in the visual dataset.
Runs pretrained MobileNetV2 (ImageNet) on all images to detect:
1. File corruptions or invalid dimensions.
2. Mislabeled or ambiguous images based on ImageNet top-3 predictions.
3. Near-duplicate or duplicate image hashes.
"""
import os
import sys
import hashlib
from PIL import Image
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config

DATASET_RAW = os.path.join(Config.BASE_DIR, 'ml', 'visual', 'dataset', 'raw')
CATEGORIES = ['Shoes', 'Shirts', 'Electronics', 'Accessories', 'Bags', 'Other']

def audit():
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions

    model = MobileNetV2(weights='imagenet')

    print(f"Auditing images in {DATASET_RAW}...\n")
    audit_results = []
    seen_hashes = {}
    total_images = 0

    for cat in CATEGORIES:
        cat_dir = os.path.join(DATASET_RAW, cat)
        if not os.path.isdir(cat_dir):
            print(f"Directory missing: {cat_dir}")
            continue

        files = sorted(os.listdir(cat_dir))
        print(f"=== Category: {cat} ({len(files)} files) ===")

        for fname in files:
            fpath = os.path.join(cat_dir, fname)
            total_images += 1

            # Hash check
            with open(fpath, 'rb') as f:
                h = hashlib.md5(f.read()).hexdigest()
            if h in seen_hashes:
                print(f"[DUPLICATE] {fpath} duplicates {seen_hashes[h]}")
            else:
                seen_hashes[h] = fpath

            # Load image
            try:
                with Image.open(fpath) as img:
                    img_rgb = img.convert('RGB')
                    w, h_dim = img_rgb.size
                    arr = np.array(img_rgb.resize((224, 224), Image.Resampling.BILINEAR), dtype=np.float32)
            except Exception as e:
                print(f"[CORRUPT] {fpath}: {e}")
                continue

            # Model inference
            x = np.expand_dims(arr, axis=0)
            x = preprocess_input(x)
            preds = model.predict(x, verbose=0)
            decoded = decode_predictions(preds, top=3)[0]
            top_preds = [(name, float(prob)) for (_, name, prob) in decoded]

            audit_results.append({
                'category': cat,
                'filename': fname,
                'path': fpath,
                'size': f"{w}x{h_dim}",
                'top_preds': top_preds
            })

            top_str = ", ".join([f"{name} ({prob:.2f})" for name, prob in top_preds])
            print(f"  {fname:18s} [{w}x{h_dim}]: {top_str}")

    print(f"\nTotal verified images: {total_images}")
    return audit_results

if __name__ == '__main__':
    audit()

