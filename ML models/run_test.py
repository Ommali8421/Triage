import os
import glob
from cough import classify_cough

# 1. This looks for ANY audio file in your folder automatically
# It checks for .wav, .webm, and .mp3
audio_files = glob.glob("*.wav") + glob.glob("*.webm") + glob.glob("*.mp3")

print("--- COUGH MODEL TESTER ---")

if not audio_files:
    print(" ERROR: No audio files found in this folder!")
    print("Make sure your .wav or .webm recordings are in: " + os.getcwd())
else:
    print(f"🔎 Found {len(audio_files)} file(s). Running analysis...\n")
    
    for file in audio_files:
        try:
            # 2. This calls your model logic from cough.py
            result, confidence = classify_cough(file)
            
            # 3. This shows you the answer
            print(f" FILE: {file}")
            print(f"RESULT: {result}")
            print(f" CONFIDENCE: {confidence}%")
            print("-" * 30)
        except Exception as e:
            print(f" Could not process {file}: {e}")

print("\nAnalysis Complete.")