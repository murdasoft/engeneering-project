"""Create and configure a Hugging Face Space for YOLO training."""

import os
from pathlib import Path

from huggingface_hub import HfApi, SpaceHardware

TOKEN = os.getenv("HF_TOKEN", "")
USER = "alllxndr"
SPACE_ID = f"{USER}/inspectai-train"
MODEL_REPO = f"{USER}/inspectai-crack-seg"

BASE = Path(__file__).parent.resolve()
SPACE_DIR = BASE / "hf_space"

FILES = {
    "Dockerfile": SPACE_DIR / "Dockerfile",
    "requirements.txt": SPACE_DIR / "requirements.txt",
    "README.md": SPACE_DIR / "README.md",
    "train.py": BASE / "train.py",
}


def main():
    if not TOKEN:
        raise ValueError("HF_TOKEN is required")

    api = HfApi(token=TOKEN)

    print(f"Creating Space {SPACE_ID}...")
    try:
        api.create_repo(
            repo_id=SPACE_ID,
            repo_type="space",
            space_sdk="docker",
            private=False,
            exist_ok=True,
        )
        print("Space created or already exists.")
    except Exception as e:
        print(f"Space create warning: {e}")

    print("Uploading files to Space...")
    for repo_path, local_path in FILES.items():
        print(f"  {repo_path}")
        api.upload_file(
            path_or_fileobj=str(local_path),
            path_in_repo=repo_path,
            repo_id=SPACE_ID,
            repo_type="space",
        )

    print("Adding HF_TOKEN and HF_MODEL_REPO secrets...")
    api.add_space_secret(SPACE_ID, "HF_TOKEN", TOKEN)
    api.add_space_secret(SPACE_ID, "HF_MODEL_REPO", MODEL_REPO)

    print("Requesting T4-medium GPU hardware...")
    api.request_space_hardware(SPACE_ID, hardware=SpaceHardware.T4_MEDIUM)

    print(f"\nDone. Space: https://huggingface.co/spaces/{SPACE_ID}")
    print(f"Trained model will be uploaded to: https://huggingface.co/{MODEL_REPO}")


if __name__ == "__main__":
    main()
