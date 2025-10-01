import requests
from PIL import Image
import io
from app.config import HF_API_TOKEN

HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def call_hf_image_api(model_id: str, image: Image.Image):
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)

    url = f"https://api-inference.huggingface.co/models/{model_id}"
    files = {"file": ("image.jpg", buf, "image/jpeg")}
    response = requests.post(url, headers=HEADERS, files=files)
    response.raise_for_status()
    return response.json()

# def get_blip_caption(image: Image.Image):
#     # BLIP may still expect a JSON base64 payload, but you can test both.
#     # If needed, use the direct image upload:
#     return call_hf_image_api("Salesforce/blip-image-captioning-base", image)

def get_clip_embedding(image: Image.Image):
    return call_hf_image_api("openai/clip-vit-base-patch32", image)
