FROM pytorch/pytorch:2.4.1-cuda11.8-cudnn9-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    git libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["bash", "-c", "EPOCHS=50 MODEL_SIZE=s HF_MODEL_REPO=alllxndr/inspectai-crack-seg nohup python -u train.py > /app/train.log 2>&1 & python -m http.server 7860"]
