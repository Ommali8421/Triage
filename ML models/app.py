import os
import uuid
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from cough import classify_cough

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tmp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class PredictResponse(BaseModel):
    risk: str
    confidence: float
    label: str

@app.post("/predict", response_model=PredictResponse)
async def predict(audio: UploadFile = File(...)):
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Empty filename")

    filename = audio.filename
    # Simple secure filename equivalent
    filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '-', '_')]).rstrip()
    if not filename:
        filename = f"{uuid.uuid4()}.webm"
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(await audio.read())
        
    try:
        label, confidence = classify_cough(filepath)
        risk = 'red' if label == 'Sick' else 'green'
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
        return {"risk": risk, "confidence": float(confidence), "label": label}
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    print("Starting Python ML backend with FastAPI...")
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
