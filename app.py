import os
import sys
import uuid
import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import Optional

# Add both model directories to path
_HERE = os.path.dirname(os.path.abspath(__file__))
_ML   = os.path.join(_HERE, 'ML models')
sys.path.insert(0, _ML)
sys.path.insert(0, os.path.join(_ML, 'Eye_Model'))

from cough import classify_cough
from eye_scan import classify_eye

app = FastAPI(title="Triage ML Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.path.join(_ML, 'tmp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ── RESPONSE MODELS ───────────────────────────────────────────────────────────

class PredictResponse(BaseModel):
    risk: str
    confidence: float
    label: str

class SingleResult(BaseModel):
    label: str
    confidence: float
    risk: str

class AnalyzeResponse(BaseModel):
    cough: SingleResult
    eye: SingleResult
    overall_risk: str
    summary: str


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _overall_risk(cough_label, cough_conf, eye_label, eye_conf) -> str:
    """Combine both model outputs into a single traffic-light risk level."""
    cough_risky = cough_label == "Sick"
    eye_risky   = eye_label   == "Anemic"

    if cough_risky and eye_risky:
        return "red"
    if cough_risky or eye_risky:
        # single flag but low confidence → yellow
        return "yellow" if min(cough_conf, eye_conf) < 70 else "red"
    return "green"

def _make_summary(cough_label, cough_conf, eye_label, eye_conf, overall) -> str:
    risk_text = {"red": "HIGH RISK", "yellow": "MODERATE RISK", "green": "LOW RISK"}
    return (
        f"Cough analysis: {cough_label} ({cough_conf:.1f}%). "
        f"Eye scan: {eye_label} ({eye_conf:.1f}%). "
        f"Overall: {risk_text.get(overall, 'UNKNOWN')}."
    )


# ── ROUTES ────────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictResponse)
async def predict(audio: UploadFile = File(...)):
    """Cough-only classification (backwards-compatible)."""
    filename = "".join([c for c in (audio.filename or "") if c.isalpha() or c.isdigit() or c in ('.', '-', '_')]) or f"{uuid.uuid4()}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    with open(filepath, "wb") as f:
        f.write(await audio.read())

    try:
        label, confidence = classify_cough(filepath)
        risk = "red" if label == "Sick" else "green"
        return {"risk": risk, "confidence": float(confidence), "label": label}
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    audio: UploadFile = File(...),
    image: UploadFile = File(...),
    sex:   str        = Form("M"),
    hb:    Optional[float] = Form(None),
):
    """
    Combined Cough + Eye Scan analysis.
    Accepts a cough audio recording and an eye image, returns a unified risk report.
    """
    audio_name = f"{uuid.uuid4()}{os.path.splitext(audio.filename or '.webm')[1]}"
    image_name = f"{uuid.uuid4()}{os.path.splitext(image.filename or '.jpg')[1]}"
    audio_path = os.path.join(UPLOAD_FOLDER, audio_name)
    image_path = os.path.join(UPLOAD_FOLDER, image_name)

    with open(audio_path, "wb") as f:
        f.write(await audio.read())
    with open(image_path, "wb") as f:
        f.write(await image.read())

    try:
        cough_label, cough_conf = classify_cough(audio_path)
        eye_label,   eye_conf   = classify_eye(image_path, sex=sex, hb=hb)

        overall = _overall_risk(cough_label, cough_conf, eye_label, eye_conf)
        summary = _make_summary(cough_label, cough_conf, eye_label, eye_conf, overall)

        return {
            "cough": {
                "label":      cough_label,
                "confidence": float(cough_conf),
                "risk":       "red" if cough_label == "Sick" else "green",
            },
            "eye": {
                "label":      eye_label,
                "confidence": float(eye_conf),
                "risk":       "red" if eye_label == "Anemic" else "green",
            },
            "overall_risk": overall,
            "summary":      summary,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in [audio_path, image_path]:
            if os.path.exists(p):
                os.remove(p)


if __name__ == "__main__":
    print("Starting Triage ML Backend (Cough + Eye Scan)...")
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=False)
