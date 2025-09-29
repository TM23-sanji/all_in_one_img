from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

t5_model_id = "google/flan-t5-base"
tokenizer = AutoTokenizer.from_pretrained(t5_model_id)
t5_model = AutoModelForSeq2SeqLM.from_pretrained(t5_model_id)

# Generate multiple captions (n_beams = 5)
def generate_captions(prompt: str, num_return_sequences: int = 1):
    inputs = tokenizer(prompt, return_tensors="pt")
    with torch.no_grad():
        output = t5_model.generate(
    **inputs,
    max_new_tokens=40,
    num_return_sequences=num_return_sequences,
    num_beams=5,
    early_stopping=True
)

    captions = [tokenizer.decode(o, skip_special_tokens=True) for o in output]
    return captions
