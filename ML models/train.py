# -*- coding: utf-8 -*-
"""
Local Cough Classifier — Healthy vs Sick
MobileNetV2 + Mel-Spectrograms · Transfer Learning Pipeline
"""

import os, random, warnings
import numpy as np
import librosa
import librosa.display
import matplotlib.pyplot as plt
import matplotlib
from PIL import Image
from pathlib import Path
from tqdm import tqdm
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# Disable GUI popups to run headlessly
matplotlib.use('Agg')
warnings.filterwarnings('ignore')

print(f'TensorFlow {tf.__version__} | GPU: {tf.config.list_physical_devices("GPU")}')

# ── 1. CONFIGURATION & LOCAL DIRECTORIES ──────────────────────────────────────
HEALTHY_DIR = os.path.join('Healthy', 'Healthy')
SICK_DIR    = os.path.join('Sick', 'Sick')
IMG_DIR     = 'spectrograms'
MODEL_PATH  = 'CareerLoop_Cough_v1.h5'

for split in ['train', 'val']:
    for cls in ['Healthy', 'Sick']:
        Path(os.path.join(IMG_DIR, split, cls)).mkdir(parents=True, exist_ok=True)

print('Directories ready ✓')

# ── 2. AUDIO → MEL-SPECTROGRAM ────────────────────────────────────────────────
IMG_SIZE   = 224
VAL_SPLIT  = 0.2
SR         = 22050
DURATION   = 3
N_MELS     = 128
HOP_LENGTH = 512

def audio_to_melspec(path, save_path):
    try:
        y, sr = librosa.load(path, sr=SR, duration=DURATION)
        if len(y) < SR * DURATION:
            y = np.pad(y, (0, SR * DURATION - len(y)))
        
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=N_MELS, hop_length=HOP_LENGTH)
        mel_db = librosa.power_to_db(mel, ref=np.max)
        
        fig, ax = plt.subplots(figsize=(2.24, 2.24), dpi=100)
        librosa.display.specshow(mel_db, sr=sr, hop_length=HOP_LENGTH, ax=ax, cmap='magma')
        ax.axis('off')
        fig.tight_layout(pad=0)
        fig.savefig(save_path, bbox_inches='tight', pad_inches=0)
        plt.close(fig)
    except Exception as e:
        raise Exception(f"Librosa/Matplotlib Error: {e}")

def process_class(src_dir, class_name):
    # Find all audio files (e.g. wav, webm, mp3, ogg, etc.)
    files = []
    for ext in ['*.webm', '*.wav', '*.mp3', '*.ogg']:
        files.extend(list(Path(src_dir).glob(f'**/{ext}')))
        
    random.shuffle(files)
    split_idx = int(len(files) * (1 - VAL_SPLIT))
    splits = {'train': files[:split_idx], 'val': files[split_idx:]}
    
    for split, flist in splits.items():
        print(f'  {class_name}/{split}: {len(flist)} files')
        for i, f in enumerate(tqdm(flist, desc=f'{class_name} {split}')):
            out = os.path.join(IMG_DIR, split, class_name, f'{class_name}_{split}_{i:04d}.png')
            # Skip if already extracted
            if os.path.exists(out): continue 
            
            try:
                audio_to_melspec(str(f), out)
            except Exception as e:
                pass


print('Processing Healthy...')
process_class(HEALTHY_DIR, 'Healthy')

print('Processing Sick...')
process_class(SICK_DIR, 'Sick')
print('\nSpectrogram generation complete ✓')


# ── 3. DATA LOADERS ───────────────────────────────────────────────────────────
BATCH_SIZE = 32

train_gen = ImageDataGenerator(
    preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1
)
val_gen = ImageDataGenerator(preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input)

train_ds = train_gen.flow_from_directory(
    os.path.join(IMG_DIR, 'train'), target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE, class_mode='binary', seed=42
)
val_ds = val_gen.flow_from_directory(
    os.path.join(IMG_DIR, 'val'), target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE, class_mode='binary', seed=42
)

print(f'Class indices: {train_ds.class_indices}')


# ── 4. MODEL — MobileNetV2 TRANSFER LEARNING ──────────────────────────────────
base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
base.trainable = False  # freeze backbone

x = base.output
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dense(256, activation='relu')(x)
x = layers.Dropout(0.4)(x)
x = layers.Dense(64, activation='relu')(x)
x = layers.Dropout(0.2)(x)
out = layers.Dense(1, activation='sigmoid')(x)

model = Model(inputs=base.input, outputs=out)
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss='binary_crossentropy',
    metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
)


# ── 5. PHASE 1 — TRAIN HEAD (frozen backbone) ─────────────────────────────────
EPOCHS_PHASE1 = 20

callbacks = [
    EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1)
]

print("\n--- PHASE 1: Training Classifier Head ---")
h1 = model.fit(
    train_ds, validation_data=val_ds,
    epochs=EPOCHS_PHASE1, callbacks=callbacks
)


# ── 6. PHASE 2 — FINE-TUNE TOP LAYERS ────────────────────────────────────────
base.trainable = True
for layer in base.layers[:-50]:   # freeze all but last 50 layers
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss='binary_crossentropy',
    metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
)

EPOCHS_PHASE2 = 20

print("\n--- PHASE 2: Fine-tuning Base Layers ---")
h2 = model.fit(
    train_ds, validation_data=val_ds,
    epochs=EPOCHS_PHASE2, callbacks=callbacks
)


# ── 7. ACCURACY & LOSS GRAPHS ─────────────────────────────────────────────────
acc  = h1.history['accuracy']  + h2.history['accuracy']
val_acc = h1.history['val_accuracy'] + h2.history['val_accuracy']
loss = h1.history['loss'] + h2.history['loss']
val_loss = h1.history['val_loss'] + h2.history['val_loss']
epochs_range = range(1, len(acc) + 1)
phase_boundary = len(h1.history['accuracy'])

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.patch.set_facecolor('#0f0f0f')

for ax in axes:
    ax.set_facecolor('#1a1a2e')
    ax.spines[:].set_color('#333')
    ax.tick_params(colors='#aaa')
    ax.xaxis.label.set_color('#ccc')
    ax.yaxis.label.set_color('#ccc')
    ax.axvline(phase_boundary + 0.5, color='#ff6b35', linestyle='--', alpha=0.6, label='Fine-tune starts')

axes[0].plot(epochs_range, acc,     color='#00d4ff', linewidth=2, label='Train Acc')
axes[0].plot(epochs_range, val_acc, color='#ff006e', linewidth=2, linestyle='--', label='Val Acc')
axes[0].set_title('Accuracy', color='white', fontsize=14, fontweight='bold')
axes[0].set_xlabel('Epoch'); axes[0].set_ylabel('Accuracy')
axes[0].legend(facecolor='#222', labelcolor='white')
axes[0].set_ylim([0, 1])

axes[1].plot(epochs_range, loss,     color='#00d4ff', linewidth=2, label='Train Loss')
axes[1].plot(epochs_range, val_loss, color='#ff006e', linewidth=2, linestyle='--', label='Val Loss')
axes[1].set_title('Loss', color='white', fontsize=14, fontweight='bold')
axes[1].set_xlabel('Epoch'); axes[1].set_ylabel('Loss')
axes[1].legend(facecolor='#222', labelcolor='white')

fig.suptitle('Cough Classifier Training History', color='white', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig('model_performance.png', dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)

print(f'\nBest Val Accuracy: {max(val_acc):.4f}')


# ── 8. SAVE MODEL ─────────────────────────────────────────────────────────────
model.save(MODEL_PATH)
print(f'\nModel successfully retrained and saved to -> {MODEL_PATH} ✓')
