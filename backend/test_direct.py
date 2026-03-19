import sys
sys.path.append(".")
from app.main import get_models, get_preprocessors
import torch
import numpy as np

print("Loading models...")
models = get_models()
preprocessors = get_preprocessors()
device = next(models['fusion'].parameters()).device
print("Models loaded.")

# Test Audio
print("Testing audio model...")
mel_spec = np.random.rand(128, 500)
tensor_a = torch.tensor(mel_spec).T
if tensor_a.shape[0] < 1024:
    tensor_a = torch.cat([tensor_a, torch.zeros(1024 - tensor_a.shape[0], 128)], dim=0)
else:
    tensor_a = tensor_a[:1024, :]
tensor_a = tensor_a.unsqueeze(0).float().to(device)

try:
    a_embed = models['audio'](tensor_a)
    print("Audio embed shape:", a_embed.shape)
except Exception as e:
    import traceback
    traceback.print_exc()

# Test Image
print("Testing image model...")
image_arr = np.random.rand(224, 224, 3)
tensor_i = torch.tensor(image_arr).permute(2, 0, 1).unsqueeze(0).float().to(device)

try:
    i_embed = models['image'](tensor_i)
    print("Image embed shape:", i_embed.shape)
except Exception as e:
    import traceback
    traceback.print_exc()

print("Testing fusion...")
try:
    score = models['fusion'](a_embed, i_embed)
    print("Fusion score computed.", score.shape)
except Exception as e:
    import traceback
    traceback.print_exc()
