import librosa
import numpy as np
import cv2
import albumentations as A

class AudioPreprocessor:
    def __init__(self, sample_rate=16000):
        self.sr = sample_rate

    def to_mel_spectrogram(self, audio_path):
        y, sr = librosa.load(audio_path, sr=self.sr)
        # Normalize loudness
        y = librosa.util.normalize(y)
        # Convert to Mel Spectrogram
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        S_db = librosa.power_to_db(S, ref=np.max)
        return S_db

class ImagePreprocessor:
    def __init__(self, size=(224, 224)):
        self.size = size
        self.augmentations = A.Compose([
            A.Rotate(limit=15),
            A.ElasticTransform(alpha=1, sigma=50, alpha_affine=50),
            A.GaussianBlur(blur_limit=(3, 5)),
            A.Normalize()
        ])

    def preprocess(self, image_path):
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        # Standardize to binary-like or grayscale if needed, but EfficientNet likes 3 channels
        img = cv2.resize(img, self.size)
        augmented = self.augmentations(image=img)["image"]
        return augmented
