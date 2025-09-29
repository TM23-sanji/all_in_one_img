from fastapi import APIRouter, UploadFile, File, Form
from PIL import Image
import io, requests
from app.services import yolo_service, clip_service, t5_service, pinecone_service
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/file-query/")
async def file_query(file: UploadFile = File(...)):
    img_bytes = await file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    # Segmentation and classes
    yolo_results = yolo_service.detect(image)

    # Image embedding for similarity
    embedding = clip_service.get_image_embedding(image)
    similar = pinecone_service.query_similar_images(embedding, top_k=3)
    captions = pinecone_service.query_similar_captions(embedding)
    captions = [match["metadata"]["text"] for match in captions]


    # Generate 5 captions from image
    # If you have a separate vision captioning model, use it, else fall back to FLAN-T5 with a generic prompt
    prompt = "Summarize the following captions into a single concise caption:\n\n" + "\n".join(captions)
    captions = t5_service.generate_captions(prompt)

    return {
        "detections": yolo_results["detections"],
        "segmented_image": yolo_results["segmented_image"],
        "captions": captions,
        "similar_images": similar,
    }

@router.post("/text-query/")
async def text_query(q: str = Form(...)):
    # Text embedding for similar image search
    embedding = clip_service.get_text_embedding(q)
    similar = pinecone_service.query_similar_images(embedding, top_k=3)
    return {
        "similar_images": similar,
    }

@router.get("/proxy-image/")
def proxy_image(url: str):
    r = requests.get(url, stream=True)
    return StreamingResponse(r.raw, media_type=r.headers.get("content-type"))
