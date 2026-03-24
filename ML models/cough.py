import os
import numpy as np
import librosa
import tensorflow as tf
import imageio_ffmpeg
import subprocess
import uuid
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import librosa.display
# Match the settings from your Colab training
IMG_SIZE = 224
THRESHOLD = 0.58 

# Load the model using absolute path relative to this file's location
MODEL_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'CareerLoop_Cough_v1.h5')
model = tf.keras.models.load_model(MODEL_NAME)

def classify_cough(audio_path):
    # 0. Convert to wav using ffmpeg if it isn't already a standard format handled by PySoundFile
    wav_path = audio_path
    if audio_path.endswith('.webm') or audio_path.endswith('.mp4') or audio_path.endswith('.mp3'):
        wav_path = audio_path + ".wav"
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg_exe, "-y", "-i", audio_path, wav_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 1. Load and Pad Audio from the .wav equivalent
    y, sr = librosa.load(wav_path, sr=22050, duration=3)
    if len(y) < 22050 * 3:
        y = np.pad(y, (0, 22050 * 3 - len(y)))
        
    # Clean up converted file
    if wav_path != audio_path and os.path.exists(wav_path):
        os.remove(wav_path)
    
    # 2. Convert to Mel-Spectrogram (Match Training exactly)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, hop_length=512)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    # 3. Process for MobileNetV2 via Matplotlib to ensure original mapping
    tmp_img = os.path.join(os.path.dirname(__file__), f"tmp_spec_{uuid.uuid4().hex}.png")
    fig, ax = plt.subplots(figsize=(2.24, 2.24), dpi=100)
    librosa.display.specshow(mel_db, sr=sr, hop_length=512, ax=ax, cmap='magma')
    ax.axis('off')
    fig.tight_layout(pad=0)
    fig.savefig(tmp_img, bbox_inches='tight', pad_inches=0)
    plt.close(fig)

    img = tf.keras.utils.load_img(tmp_img, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = tf.keras.utils.img_to_array(img)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    img_final = np.expand_dims(img_array, axis=0)

    if os.path.exists(tmp_img):
        os.remove(tmp_img)

    # 4. Predict
    prob = model.predict(img_final, verbose=0)[0][0]
    
    label = 'Sick' if prob >= THRESHOLD else 'Healthy'
    confidence = prob if prob >= THRESHOLD else (1 - prob)
    
    return label, round(float(confidence * 100), 2)