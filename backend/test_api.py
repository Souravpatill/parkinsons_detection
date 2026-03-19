import requests
import numpy as np
import scipy.io.wavfile as wav
import cv2

wav.write("dummy.wav", 16000, np.random.randint(-32768, 32767, 16000, dtype=np.int16))
cv2.imwrite("dummy.png", np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))

print("Testing audio...")
res = requests.post("http://localhost:8000/predict/audio", files={"file": open("dummy.wav", "rb")})
print("Audio:", res.status_code, res.text)

print("Testing spiral...")
res = requests.post("http://localhost:8000/predict/spiral", files={"file": open("dummy.png", "rb")})
print("Spiral:", res.status_code, res.text)

print("Testing fusion...")
res = requests.post("http://localhost:8000/predict/fusion", files={"audio": open("dummy.wav", "rb"), "spiral": open("dummy.png", "rb")})
print("Fusion:", res.status_code, res.text)
