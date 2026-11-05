"""
Module 3: Visual Product Recognition — Transfer Learning with MobileNetV2.

Trains a CNN transfer learning model on genuine product photographs across 6 categories:
  - Shoes
  - Shirts
  - Electronics
  - Accessories
  - Bags
  - Other

Pipeline:
  1. Loads verified real product images from ml/visual/dataset/{train,val,test}
  2. Applies data augmentation (RandomFlip, RandomRotation, RandomZoom, RandomContrast)
  3. Pretrained MobileNetV2 feature extractor (ImageNet weights)
  4. Classification head with Dropout and Batch Normalization
  5. Two-stage training: feature transfer + top-layer fine-tuning
  6. Rigorous test evaluation: per-class precision, recall, F1, and confusion matrix
  7. Persists model artifacts, class labels, and evaluation metrics

Saves:
  backend/saved_models/visual_classifier.keras
  backend/saved_models/visual_classes.json
  backend/results/visual_metrics.json
  backend/logs/visual/ (TensorBoard)
"""
import os
import sys
import json
import time
import numpy as np
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config
from ml.utils.tensorboard_utils import make_tensorboard_callback
from ml.visual.download_dataset import download_and_prepare_dataset, DATASET_ROOT

CATEGORIES = ['Shoes', 'Shirts', 'Electronics', 'Accessories', 'Bags', 'Other']
IMG_SIZE = (224, 224)


def load_split_images(split_name: str):
    """Loads all images and integer labels from the specified split directory."""
    split_dir = os.path.join(DATASET_ROOT, split_name)
    if not os.path.exists(split_dir):
        print(f'Dataset split {split_name} not found. Downloading dataset...')
        download_and_prepare_dataset()

    images = []
    labels = []
    for cat_idx, cat in enumerate(CATEGORIES):
        cat_dir = os.path.join(split_dir, cat)
        if not os.path.exists(cat_dir):
            continue
        for fname in sorted(os.listdir(cat_dir)):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                fpath = os.path.join(cat_dir, fname)
                try:
                    with Image.open(fpath) as img:
                        img_rgb = img.convert('RGB').resize(IMG_SIZE, Image.Resampling.BILINEAR)
                        arr = np.array(img_rgb, dtype=np.float32)
                        images.append(arr)
                        labels.append(cat_idx)
                except Exception as e:
                    print(f'Warning: failed to load {fpath}: {e}')

    return np.array(images, dtype=np.float32), np.array(labels, dtype=np.int32)


def build_transfer_model(num_classes=len(CATEGORIES)):
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.applications import MobileNetV2

    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg',
    )
    base_model.trainable = False

    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.08),
        layers.RandomZoom(0.08),
        layers.RandomContrast(0.08),
    ], name='augmentation')

    inputs = tf.keras.Input(shape=(224, 224, 3), name='image_input')
    # MobileNetV2 expects inputs in [-1, 1]
    rescaled = layers.Rescaling(scale=1.0 / 127.5, offset=-1.0)(inputs)
    augmented = data_augmentation(rescaled)
    features = base_model(augmented, training=False)
    x = layers.Dense(128, activation='relu', name='feature_dense')(features)
    x = layers.BatchNormalization(name='feature_bn')(x)
    x = layers.Dropout(0.35, name='feature_dropout')(x)
    outputs = layers.Dense(num_classes, activation='softmax', name='category_softmax')(x)

    model = models.Model(inputs, outputs, name='MobileNetV2_ProductClassifier')
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model, base_model


def train_visual_classifier(epochs=15, fine_tune_epochs=5):
    print('\n======================================================')
    print('  Training Module 3: MobileNetV2 Visual Classifier    ')
    print('  Using Real E-Commerce Product Image Photographs     ')
    print('======================================================\n')
    from tensorflow import keras
    from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

    # Load authentic dataset splits
    X_train, y_train = load_split_images('train')
    X_val, y_val = load_split_images('val')
    X_test, y_test = load_split_images('test')

    print(f'Train images: {len(X_train)}  |  Val images: {len(X_val)}  |  Test images: {len(X_test)}')
    model, base_model = build_transfer_model(num_classes=len(CATEGORIES))

    tb_cb = make_tensorboard_callback(Config.LOGS_DIR, os.path.join('visual', 'mobilenet_v2'))
    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True)

    start = time.time()
    print('\nStage 1: Training classification head...')
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=8,
        callbacks=[tb_cb, early_stop],
        verbose=1,
    )

    print('\nStage 2: Fine-tuning top 20 layers of MobileNetV2...')
    base_model.trainable = True
    for layer in base_model.layers[:-20]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=2e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    fine_history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=fine_tune_epochs,
        batch_size=8,
        callbacks=[early_stop],
        verbose=1,
    )
    elapsed = time.time() - start

    # Evaluation on held-out unseen test split
    print('\nEvaluating on held-out test split...')
    test_probs = model.predict(X_test, verbose=0)
    test_preds = np.argmax(test_probs, axis=1)

    test_acc = float(accuracy_score(y_test, test_preds))
    cm = confusion_matrix(y_test, test_preds).tolist()
    report = classification_report(
        y_test, test_preds,
        target_names=CATEGORIES,
        output_dict=True,
        zero_division=0,
    )

    print(f'Test Accuracy: {test_acc:.4f}')
    print('\nPer-class performance on test set:')
    for cat in CATEGORIES:
        if cat in report:
            f1 = report[cat]['f1-score']
            prec = report[cat]['precision']
            rec = report[cat]['recall']
            print(f'  {cat:12s} - Precision: {prec:.2f}, Recall: {rec:.2f}, F1: {f1:.2f}')

    # Save artifacts
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    os.makedirs(Config.RESULTS_DIR, exist_ok=True)
    model_path = os.path.join(Config.SAVED_MODELS_DIR, 'visual_classifier.keras')
    classes_path = os.path.join(Config.SAVED_MODELS_DIR, 'visual_classes.json')
    metrics_path = os.path.join(Config.RESULTS_DIR, 'visual_metrics.json')

    model.save(model_path)
    with open(classes_path, 'w') as f:
        json.dump(CATEGORIES, f, indent=2)

    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    metrics = {
        'model_name': 'MobileNetV2 Fine-Tuned Transfer Learning',
        'dataset': 'SmartCart Real E-Commerce Product Image Dataset (Unsplash CC0-equivalent)',
        'categories': CATEGORIES,
        'test_accuracy': test_acc,
        'val_accuracy': float(val_acc),
        'val_loss': float(val_loss),
        'training_time_seconds': round(elapsed, 2),
        'confusion_matrix': cm,
        'classification_report': report,
        'epochs_run': len(history.history['loss']) + len(fine_history.history['loss']),
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f'\nModel saved -> {model_path}')
    print(f'Class labels saved -> {classes_path}')
    print(f'Metrics saved -> {metrics_path}')
    return metrics


if __name__ == '__main__':
    train_visual_classifier(epochs=12, fine_tune_epochs=5)
