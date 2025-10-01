from pinecone import Pinecone, ServerlessSpec
from app.config import PINECONE_API_KEY, PINECONE_ENV, PINECONE_INDEX
from app.services import hf_service
import os
from dotenv import load_dotenv
load_dotenv()

api_base_url = os.getenv("API_BASE_URL")


# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

if PINECONE_INDEX not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=512,    # Adjust as per your clip embedding dimension
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
    )

index = pc.Index(PINECONE_INDEX)

def upsert_image(id: str, image, metadata: dict = None):
    embedding = hf_service.get_clip_embedding(image)
    if isinstance(embedding, dict) and "embedding" in embedding:
        embedding = embedding["embedding"]
    index.upsert([(id, embedding, metadata or {})])

def query_similar_images(embedding_vector, top_k=5):
    # embedding = hf_service.get_clip_embedding(image)
    # if isinstance(embedding, dict) and "embedding" in embedding:
    #     embedding = embedding["embedding"]
    res = index.query(vector=embedding_vector, top_k=top_k, include_metadata=True, namespace='train', filter={"type": "image"})
    # return [
    #     {"id": match["id"], "score": match["score"], "metadata": match.get("metadata")}
    #     for match in res["matches"]
    # ]
    # base_url = "http://images.cocodataset.org/train2017/"
    # formatted = []
    # for match in res["matches"]:
    #     img_id = int(match["id"])
    #     # COCO filenames are zero-padded to 12 digits
    #     filename = f"{img_id:012}.jpg"
    #     url = f"{base_url}{filename}"
    #     formatted.append({
    #         "id": match["id"],
    #         "score": match["score"],
    #         "url": url,
    #         "metadata": match.get("metadata", {})
    #     })
    # return formatted

    base_url = "http://images.cocodataset.org/train2017/"
    formatted = []
    for match in res["matches"]:
        img_id = int(match["id"])
        filename = f"{img_id:012}.jpg"
        original_url = f"{base_url}{filename}"

    # Construct the proxied URL for your frontend
        proxied_url = f"{api_base_url}/api/proxy-image?url={original_url}"

        formatted.append({
            "id": match["id"],
            "score": match["score"],
            "url": proxied_url, # Return the proxied URL
            "metadata": match.get("metadata", {})
        })
    return formatted

def query_similar_captions(embedding_vector, top_k=2):
    res = index.query(vector=embedding_vector, top_k=top_k, include_metadata=True, namespace='train', filter={"type": "caption"})
    return [
        {"id": match["id"], "score": match["score"], "metadata": match.get("metadata")}
        for match in res["matches"]
    ]

