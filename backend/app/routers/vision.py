from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image
import io, requests, httpx
from app.services import yolo_service, clip_service, t5_service, pinecone_service
from fastapi.responses import StreamingResponse, Response

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

@router.get("/proxy-image")
async def proxy_image(url: str):
    if not url.startswith("http://"):
        raise HTTPException(status_code=400, detail="Invalid URL. Only HTTP URLs are allowed for proxying.")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status() # Raise an exception for bad status codes

        # Return the image data with the correct content type
        return Response(content=response.content, media_type=response.headers["content-type"])

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch image from source: {e}")
    except KeyError:
        raise HTTPException(status_code=500, detail="Could not determine image content type.")
