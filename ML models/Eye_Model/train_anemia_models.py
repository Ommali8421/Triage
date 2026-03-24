import os
import pickle
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

def train_and_save():
    print("Loading kaggle data...")
    try:
        import kagglehub
        dataset_path = kagglehub.dataset_download('nahiyan1402/anemiadataset')
        csv_path = os.path.join(dataset_path, 'Anemia_Dataset.csv')
    except Exception as e:
        print(f"Failed to use kagglehub: {e}")
        return
        
    print(f"Loading data from {csv_path}")
    data = pd.read_csv(csv_path)
    
    le = LabelEncoder()
    data["anaemic_encoded"] = le.fit_transform(data['Anaemic'])
    # Check what sex values exist, usually M and F
    data["sex_encoded"] = le.fit_transform(data['Sex'])
    
    # Sex distribution to understand the encoding
    print("Sex encoding mapping:")
    for i, c in enumerate(le.classes_):
        print(f"{i} -> {c}")
        
    X_full = data[['sex_encoded', '   %Red Pixel', '%Green pixel', '%Blue pixel', 'Hb']]
    y = data['anaemic_encoded']
    
    X_vision = data[['   %Red Pixel', '%Green pixel', '%Blue pixel']]
    
    print("Training Full Model (RFC)...")
    rfc = RandomForestClassifier(n_estimators=100, random_state=42)
    rfc.fit(X_full, y)
    
    print("Training Vision Only Model (RFC Vision)...")
    rfc_vision = RandomForestClassifier(n_estimators=100, random_state=42)
    rfc_vision.fit(X_vision, y)
    
    # Save the models
    with open('anemia_model.pkl', 'wb') as f:
        pickle.dump(rfc, f)
        
    with open('anemia_vision_model.pkl', 'wb') as f:
        pickle.dump(rfc_vision, f)
        
    print("Models saved to anemia_model.pkl and anemia_vision_model.pkl")

if __name__ == "__main__":
    train_and_save()
