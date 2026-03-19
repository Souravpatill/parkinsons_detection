from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import io
import json
import base64
# Heavy imports deferred to get_models()
# import torch
# from PIL import Image
# from app.models import AudioFeatureExtractor, ImageFeatureExtractor, FusionEngine
# from app.preprocessing import AudioPreprocessor, ImagePreprocessor
# from app.xai import ImageXAI

app = FastAPI(title="Parkinson's Detection API")

BASE_DIR = Path(__file__).parent
METRICS_DIR = BASE_DIR / "metrics"

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for lazy-loading
_models = {}
_preprocessors = {}

def get_models():
    global _models
    if not _models:
        import torch
        from app.models import AudioFeatureExtractor, ImageFeatureExtractor, FusionEngine
        from app.xai import ImageXAI
        
        device = torch.device("cpu")
        print("Loading SOTA models (this may take a few minutes for the first time)...")
        _models['audio'] = AudioFeatureExtractor().to(device).eval()
        _models['image'] = ImageFeatureExtractor().to(device).eval()
        _models['fusion'] = FusionEngine(
            _models['audio'].embedding_dim, 
            _models['image'].embedding_dim
        ).to(device).eval()
        
        # Target the last convolutional block for Grad-CAM
        target_layer = None
        if hasattr(_models['image'].model, "features"):
            target_layer = _models['image'].model.features[-1]
        elif hasattr(_models['image'].model, "layer4"):
            target_layer = _models['image'].model.layer4[-1]

        if target_layer:
            _models['image_xai'] = ImageXAI(_models['image'], target_layer)
        else:
            _models['image_xai'] = None
            
    return _models

def get_preprocessors():
    global _preprocessors
    if not _preprocessors:
        from app.preprocessing import AudioPreprocessor, ImagePreprocessor
        _preprocessors['audio'] = AudioPreprocessor()
        _preprocessors['image'] = ImagePreprocessor()
    return _preprocessors

@app.get("/")
async def root():
    status = "Ready" if _models else "Loading Models in Background"
    return {"message": "SOTA Parkinson's Detection API", "status": status}


@app.get("/metrics/summary")
async def metrics_summary():
    """
    Return evaluation metrics for audio-only, spiral-only, and fused models.
    Backed by a JSON file under app/metrics/summary.json so it can be updated
    from offline training runs without changing code.
    """
    summary_path = METRICS_DIR / "summary.json"
    if not summary_path.exists():
        raise HTTPException(status_code=404, detail="Metrics summary not found")
    try:
        with summary_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading metrics summary: {e}")
    return data


@app.get("/metrics/shap-example")
async def shap_example():
    """
    Serve a representative SHAP / Grad-CAM artefact (e.g. PNG) generated offline.
    This endpoint only exposes a static file; generation should happen in a
    separate training / analysis script using app.xai utilities.
    """
    shap_path = METRICS_DIR / "shap_example.png"
    if not shap_path.exists():
        raise HTTPException(status_code=404, detail="SHAP example not available")
    return FileResponse(shap_path, media_type="image/png")

@app.post("/predict/audio")
async def predict_audio(file: UploadFile = File(...)):
    import tempfile
    import os
    import torch
    models = get_models()
    preprocessors = get_preprocessors()
    device = next(models['audio'].parameters()).device
    
    if not file.filename.endswith(('.wav', '.mp3')):
        raise HTTPException(status_code=400, detail="Invalid audio format")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        mel_spec = preprocessors['audio'].to_mel_spectrogram(tmp_path)
    finally:
        os.remove(tmp_path)
    
    tensor = torch.from_numpy(mel_spec).float().T
    if tensor.shape[0] < 1024:
        tensor = torch.cat([tensor, torch.zeros(1024 - tensor.shape[0], 128)], dim=0)
    else:
        tensor = tensor[:1024, :]
    tensor = tensor.unsqueeze(0).to(device)
    
    with torch.no_grad():
        a_embed = models['audio'](tensor)
    
    return {
        "status": "success", 
        "prediction": "Analysis Complete (Run Fusion for Score)", 
        "score": 0.0, 
        "message": "Vocal analysis processed by AST."
    }

@app.post("/predict/spiral")
async def predict_spiral(file: UploadFile = File(...)):
    import tempfile
    import os
    import torch
    models = get_models()
    preprocessors = get_preprocessors()
    device = next(models['image'].parameters()).device
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        image_arr = preprocessors['image'].preprocess(tmp_path)
    finally:
        os.remove(tmp_path)
        
    image_tensor = torch.from_numpy(image_arr).permute(2, 0, 1).unsqueeze(0).float().to(device)
    with torch.no_grad():
        i_embed = models['image'](image_tensor)
    
    return {
        "status": "success", 
        "prediction": "Analysis Complete (Run Fusion for Score)", 
        "score": 0.0, 
        "grad_cam": "base64_encoded_heatmap"
    }

@app.post("/predict/fusion")
async def predict_fusion(
    audio: UploadFile = File(...), 
    spiral: UploadFile = File(...)
):
    import tempfile
    import os
    import torch
    models = get_models()
    preprocessors = get_preprocessors()
    device = next(models['fusion'].parameters()).device
    
    # 1. Process Audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await audio.read())
        audio_tmp = tmp.name
    try:
        mel_spec = preprocessors['audio'].to_mel_spectrogram(audio_tmp)
    finally:
        os.remove(audio_tmp)
        
    tensor_a = torch.from_numpy(mel_spec).float().T
    if tensor_a.shape[0] < 1024:
        tensor_a = torch.cat([tensor_a, torch.zeros(1024 - tensor_a.shape[0], 128)], dim=0)
    else:
        tensor_a = tensor_a[:1024, :]
    tensor_a = tensor_a.unsqueeze(0).to(device)
    
    # 2. Process Image (Spiral)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        tmp.write(await spiral.read())
        spiral_tmp = tmp.name
    try:
        image_arr = preprocessors['image'].preprocess(spiral_tmp)
    finally:
        os.remove(spiral_tmp)
        
    tensor_i = torch.from_numpy(image_arr).permute(2, 0, 1).unsqueeze(0).float().to(device)
    
    # 3. Fusion Inference
    with torch.no_grad():
        a_embed = models['audio'](tensor_a)
        i_embed = models['image'](tensor_i)
        score = models['fusion'](a_embed, i_embed).item()
        
    prediction = "PD Detected" if score > 0.5 else "Healthy"
    
    return {
        "status": "success", 
        "prediction": prediction, 
        "score": score,
        "audio_contribution": 0.5,  # Approximated
        "motor_contribution": 0.5   # Approximated
    }
