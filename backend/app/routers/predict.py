# from fastapi import APIRouter, UploadFile, File
# from PIL import Image
# import io
# from app.services import hf_service, pinecone_service

# router = APIRouter()

# @router.post("/caption/")
# async def generate_caption(file: UploadFile = File(...)):
#     contents = await file.read()
#     image = Image.open(io.BytesIO(contents)).convert("RGB")
#     caption = hf_service.get_blip_caption(image)
#     return {"caption": caption}

# @router.post("/embedding/")
# async def get_embedding(file: UploadFile = File(...)):
#     contents = await file.read()
#     image = Image.open(io.BytesIO(contents)).convert("RGB")
#     embedding = hf_service.get_clip_embedding(image)
#     return {"embedding": embedding}

# @router.post("/similar/")
# async def similar_images(file: UploadFile = File(...)):
#     img_bytes = await file.read()
#     image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
#     results = pinecone_service.query_similar_images(image)
#     return {"similar_images": results}
