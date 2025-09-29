# from fastapi import FastAPI, File, UploadFile, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from ultralytics import YOLO
# from PIL import Image
# import io, base64, uuid

# # Load YOLO model once at startup
# yolo_model = YOLO("yolov9m.pt")

# # Simple in-memory cache for segmented images
# _in_memory_images = {}

# app = FastAPI()

# # Allow React dev server (adjust origins as needed)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# def detect_image_bytes(image_bytes: bytes):
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#     results = yolo_model.predict(source=img, conf=0.25, verbose=False)
#     r = results[0]

#     annotated = r.plot()  # numpy array with masks/boxes
#     pil_img = Image.fromarray(annotated)

#     buf = io.BytesIO()
#     pil_img.save(buf, format="PNG")
#     byte_img = buf.getvalue()
#     encoded = base64.b64encode(byte_img).decode("ascii")

#     detections = []
#     for box in r.boxes:
#         cls_idx = int(box.cls.cpu().numpy()) if hasattr(box.cls, "cpu") else int(box.cls)
#         conf = float(box.conf.cpu().numpy()) if hasattr(box.conf, "cpu") else float(box.conf)
#         detections.append({"class": yolo_model.names[cls_idx], "confidence": conf})

#     return {"detections": detections, "segmented_image": encoded}


# @app.post("/api/detect/")
# async def detect_route(file: UploadFile = File(...)):
#     img_bytes = await file.read()
#     result = detect_image_bytes(img_bytes)

#     # Store image (decoded from base64) in memory with an ID
#     img_data = base64.b64decode(result["segmented_image"])
#     img_id = str(uuid.uuid4())
#     _in_memory_images[img_id] = img_data

#     return {
#         "detections": result["detections"],
#         "segmented_url": f"/api/detect/segmented/{img_id}",
#     }


# @app.get("/api/detect/segmented/{img_id}")
# async def get_segmented(img_id: str):
#     data = _in_memory_images.get(img_id)
#     if not data:
#         raise HTTPException(status_code=404, detail="Image not found")
#     return StreamingResponse(io.BytesIO(data), media_type="image/png")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import detect, predict, vision

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(detect.router, prefix="/api/detect", tags=["detect"])
# app.include_router(predict.router, prefix="/api/predict", tags=["predict"])
app.include_router(vision.router, prefix="/api", tags=["vision"])
