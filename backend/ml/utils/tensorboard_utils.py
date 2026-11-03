import os
from tensorflow import keras


def make_tensorboard_callback(logs_dir: str, run_name: str):
    """Creates a TensorBoard callback writing to backend/logs/<run_name>/.
    View with:  tensorboard --logdir logs   (run from the backend/ folder)."""
    log_path = os.path.join(logs_dir, run_name)
    os.makedirs(log_path, exist_ok=True)
    return keras.callbacks.TensorBoard(log_dir=log_path, histogram_freq=0, write_graph=False)
