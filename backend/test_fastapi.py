from fastapi.testclient import TestClient
from app.main import app
import numpy as np
import scipy.io.wavfile as wav
import cv2
import traceback

client = TestClient(app, raise_server_exceptions=True)

wav.write("dummy.wav", 16000, np.random.randint(-32768, 32767, 16000, dtype=np.int16))
cv2.imwrite("dummy.png", np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))

with open("trace.txt", "w", encoding="utf-8") as out:
    try:
        with open("dummy.wav", "rb") as f:
            response = client.post("/predict/audio", files={"file": ("dummy.wav", f, "audio/wav")})
            out.write(f"Audio: {response.status_code}\n")
    except Exception as e:
        out.write("Audio Exception:\n")
        out.write(traceback.format_exc() + "\n")

    try:
        with open("dummy.png", "rb") as f:
            response = client.post("/predict/spiral", files={"file": ("dummy.png", f, "image/png")})
            out.write(f"Spiral: {response.status_code}\n")
    except Exception as e:
        out.write("Spiral Exception:\n")
        out.write(traceback.format_exc() + "\n")

    try:
        with open("dummy.wav", "rb") as fa:
            with open("dummy.png", "rb") as fs:
                response = client.post("/predict/fusion", files={
                    "audio": ("dummy.wav", fa, "audio/wav"), 
                    "spiral": ("dummy.png", fs, "image/png")
                })
                out.write(f"Fusion: {response.status_code}\n")
    except Exception as e:
        out.write("Fusion Exception:\n")
        out.write(traceback.format_exc() + "\n")
