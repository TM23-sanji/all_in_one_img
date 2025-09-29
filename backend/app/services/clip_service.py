from transformers import CLIPModel, CLIPProcessor
import torch
from PIL import Image

clip_model_id = "openai/clip-vit-base-patch32"
clip_model = CLIPModel.from_pretrained(clip_model_id)
clip_processor = CLIPProcessor.from_pretrained(clip_model_id)

def get_image_embedding(image: Image.Image):
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        img_features = clip_model.get_image_features(**inputs)
    return img_features[0].cpu().numpy().tolist()

def get_text_embedding(text: str):
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        txt_features = clip_model.get_text_features(**inputs)
    return txt_features[0].cpu().numpy().tolist()
