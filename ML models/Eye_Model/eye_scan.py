import os
import pickle
import numpy as np
import pandas as pd
from PIL import Image

_HERE = os.path.dirname(os.path.abspath(__file__))

# Load models
try:
    with open(os.path.join(_HERE, 'anemia_model.pkl'), 'rb') as f:
        rfc = pickle.load(f)
    with open(os.path.join(_HERE, 'anemia_vision_model.pkl'), 'rb') as f:
        rfc_vision = pickle.load(f)
except Exception as e:
    print(f"Warning: Failed to load anemia models: {e}. Please run train_anemia_models.py first.")
    rfc = None
    rfc_vision = None

def classify_eye(image_path, sex=None, hb=None):
    if not rfc_vision or not rfc:
        return ("Unknown", 0.0)
        
    try:
        img = Image.open(image_path).convert('RGB')
        width, height = img.size
        
        # Crop to the center 50%
        img_cropped = img.crop((width * 0.25, height * 0.25, width * 0.75, height * 0.75))
        img_array = np.array(img_cropped)
        
        avg_red = img_array[:,:,0].mean()
        avg_green = img_array[:,:,1].mean()
        avg_blue = img_array[:,:,2].mean()
        
        total_rgb = avg_red + avg_green + avg_blue
        if total_rgb == 0:
            total_rgb = 1 # Avoid division by zero
            
        p_red = (avg_red / total_rgb) * 100
        p_green = (avg_green / total_rgb) * 100
        p_blue = (avg_blue / total_rgb) * 100
        
        if sex and str(hb).strip() != "" and str(hb).strip() != "None":
            # Anemia_detector encoding: M -> 1, F -> 0
            sex_encoded = 1 if str(sex).upper() == 'M' else 0
            input_df = pd.DataFrame([[sex_encoded, p_red, p_green, p_blue, float(hb)]],
                                    columns=['sex_encoded', '   %Red Pixel', '%Green pixel', '%Blue pixel', 'Hb'])
            pred = rfc.predict(input_df)[0]
            prob = rfc.predict_proba(input_df)[0]
        else:
            # Fallback to vision-only if clinical data is missing
            input_df = pd.DataFrame([[p_red, p_green, p_blue]],
                                    columns=['   %Red Pixel', '%Green pixel', '%Blue pixel'])
            pred = rfc_vision.predict(input_df)[0]
            prob = rfc_vision.predict_proba(input_df)[0]
            
        # 1 -> Anaemic, 0 -> Non-Anaemic (based on Anemia_detector.py)
        label = "Anemic" if pred == 1 else "Healthy"
        confidence = float(max(prob) * 100)
        
        return (label, confidence)
        
    except Exception as e:
        print(f"Error in classify_eye: {e}")
        return ("Error", 0.0)

if __name__ == "__main__":
    # Small test if run directly
    print(classify_eye("dummy.jpg"))
