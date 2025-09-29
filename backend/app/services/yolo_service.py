from ultralytics import YOLO
from PIL import Image
import io
import base64

yolo_model = YOLO("yolov9m.pt")

def detect(image: Image.Image):
    results = yolo_model.predict(source=image, conf=0.25, verbose=False)
    r = results[0]

    annotated = r.plot()
    pil_img = Image.fromarray(annotated)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    encoded_img = base64.b64encode(buf.getvalue()).decode()

    detections = []
    for box in r.boxes:
        cls_idx = int(box.cls.cpu().numpy()) if hasattr(box.cls, "cpu") else int(box.cls)
        conf = float(box.conf.cpu().numpy()) if hasattr(box.conf, "cpu") else float(box.conf)
        detections.append({
            "class": yolo_model.names[cls_idx],
            "confidence": conf
        })

    return {
        "detections": detections,
        "segmented_image": encoded_img
    }
