"""
ANN architecture builder used by every training script (basic model +
all Module 2 variants). Centralizing this keeps every experiment
comparable — they only differ in the hyperparameters passed in.
"""
from tensorflow import keras
from tensorflow.keras import layers, regularizers, initializers


def _get_initializer(name: str):
    name = (name or 'glorot').lower()
    if name in ('he', 'he_normal'):
        return initializers.HeNormal(seed=42)
    if name in ('xavier', 'glorot', 'glorot_normal'):
        return initializers.GlorotNormal(seed=42)
    if name in ('random', 'random_normal'):
        return initializers.RandomNormal(seed=42)
    if name in ('uniform', 'random_uniform'):
        return initializers.RandomUniform(seed=42)
    return initializers.GlorotNormal(seed=42)


def build_ann(
    input_dim: int,
    hidden_units: int = 64,
    dropout: float = 0.0,
    l2: float = 0.0,
    use_batchnorm: bool = False,
    initialization: str = 'glorot',
    learning_rate: float = 0.001,
):
    """
    Input -> Dense+ReLU -> [BatchNorm] -> [Dropout] -> Dense+ReLU -> [BatchNorm] -> [Dropout] -> Sigmoid

    Every optional block (dropout / L2 / batchnorm / initializer / learning rate)
    is togglable so the same builder produces every Module 2 experiment variant:
      - Basic ANN:            all optional args at defaults
      - Dropout:               dropout > 0
      - L2 Regularization:     l2 > 0
      - Batch Normalization:   use_batchnorm = True
      - Optimized Model:        combination of the above + tuned learning rate
    """
    kernel_init = _get_initializer(initialization)
    kernel_reg = regularizers.l2(l2) if l2 and l2 > 0 else None

    inputs = keras.Input(shape=(input_dim,), name='features')
    x = layers.Dense(hidden_units, kernel_initializer=kernel_init, kernel_regularizer=kernel_reg)(inputs)
    if use_batchnorm:
        x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    if dropout and dropout > 0:
        x = layers.Dropout(dropout)(x)

    x = layers.Dense(max(hidden_units // 2, 8), kernel_initializer=kernel_init, kernel_regularizer=kernel_reg)(x)
    if use_batchnorm:
        x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    if dropout and dropout > 0:
        x = layers.Dropout(dropout)(x)

    outputs = layers.Dense(1, activation='sigmoid', name='output')(x)

    model = keras.Model(inputs, outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='binary_crossentropy',
        metrics=['accuracy'],
    )
    return model
