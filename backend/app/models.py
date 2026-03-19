import torch
import torch.nn as nn
import torchvision.models as models
from transformers import ASTModel, ASTConfig

class AudioFeatureExtractor(nn.Module):
    def __init__(self, use_ast=True):
        super(AudioFeatureExtractor, self).__init__()
        if use_ast:
            # SOTA: Audio Spectrogram Transformer
            self.model = ASTModel.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
            self.embedding_dim = 768
        else:
            # Fallback: ResNet34
            resnet = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
            # Adapt first layer for spectrograms (usually 1 channel, but we can treat as RGB)
            self.model = nn.Sequential(*list(resnet.children())[:-1])
            self.embedding_dim = 512

    def forward(self, x):
        if hasattr(self, 'model') and isinstance(self.model, ASTModel):
            outputs = self.model(x)
            return outputs.last_hidden_state[:, 0, :] # CLS token
        else:
            return self.model(x).view(x.size(0), -1)

class ImageFeatureExtractor(nn.Module):
    def __init__(self, model_name="efficientnet_v2_s"):
        super(ImageFeatureExtractor, self).__init__()
        # SOTA: EfficientNetV2
        if model_name == "efficientnet_v2_s":
            self.model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
            self.embedding_dim = 1280 # EfficientNetV2-S default embedding size
        else:
            self.model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            self.embedding_dim = 2048
        
        # Strip classification head
        self.model.classifier = nn.Identity()

    def forward(self, x):
        return self.model(x)

class CrossModalAttention(nn.Module):
    def __init__(self, embed_dim, num_heads=8):
        super(CrossModalAttention, self).__init__()
        self.multihead_attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm = nn.LayerNorm(embed_dim)
        
    def forward(self, query, key, value):
        # query: audio, key/value: image (or vice versa)
        attn_output, _ = self.multihead_attn(query, key, value)
        return self.norm(query + attn_output)

class FusionEngine(nn.Module):
    def __init__(self, audio_dim, image_dim, hidden_dim=512):
        super(FusionEngine, self).__init__()
        # If dimensions differ, project to same space for attention
        self.audio_proj = nn.Linear(audio_dim, 512)
        self.image_proj = nn.Linear(image_dim, 512)
        
        self.cross_attn = CrossModalAttention(512)
        
        self.classifier = nn.Sequential(
            nn.Linear(512 * 2, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        )

    def forward(self, audio_embed, image_embed):
        a = self.audio_proj(audio_embed).unsqueeze(1) # [B, 1, 512]
        i = self.image_proj(image_embed).unsqueeze(1) # [B, 1, 512]
        
        # Audio attending to Image
        a_fused = self.cross_attn(a, i, i).squeeze(1)
        # Image attending to Audio
        i_fused = self.cross_attn(i, a, a).squeeze(1)
        
        combined = torch.cat([a_fused, i_fused], dim=1)
        return self.classifier(combined)
