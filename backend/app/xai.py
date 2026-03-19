import torch
import torch.nn.functional as F
import numpy as np
import cv2
import shap
from captum.attr import LayerGradCam, visualization as vit

class ImageXAI:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.lgc = LayerGradCam(model, target_layer)

    def generate_heatmap(self, input_tensor):
        # input_tensor: [1, 3, 224, 224]
        attr = self.lgc.attribute(input_tensor, target=0)
        # Upsample and visualize
        heatmap = vit.visualize_image_attr(
            np.transpose(attr.squeeze().cpu().detach().numpy(), (1, 2, 0)),
            method="heat_map",
            show_colorbar=True,
            sign="all"
        )
        return heatmap

class AudioXAI:
    def __init__(self, model):
        self.model = model

    def explain_spectrogram(self, background_data, test_data):
        # background_data: representative set of spectrograms
        # test_data: the spectrogram to explain
        explainer = shap.DeepExplainer(self.model, background_data)
        shap_values = explainer.shap_values(test_data)
        return shap_values
