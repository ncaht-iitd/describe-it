"""Describe service: alt text and a long description for one image, from any configured model.

Run locally (from the `services` folder):
    uvicorn describe_service.main:app --reload --port 8001

Only the gateway (Describe-it server) should call this service. When SERVICE_TOKEN is
set, every /v1 request must send it in the X-Service-Token header.
"""
import base64
import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from describeit_models import GenerationError, available_models, find_model, generate

load_dotenv(Path(__file__).with_name(".env"))

PROMPTS_DIR = Path(__file__).with_name("prompts")
DEFAULT_PROMPT = os.environ.get("DEFAULT_PROMPT", "describe-v1")
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}

app = FastAPI(title="Describe-it Describe service", version="1.0.0")


def require_token(x_service_token: str | None = Header(default=None)) -> None:
    expected = os.environ.get("SERVICE_TOKEN", "")
    if expected and x_service_token != expected:
        raise HTTPException(status_code=401, detail="Missing or wrong service token.")


# ---------- prompts ----------

def prompt_versions() -> list[str]:
    return sorted(p.stem for p in PROMPTS_DIR.glob("describe-v*.md"))


def load_prompt(version: str) -> tuple[str, str]:
    if version not in prompt_versions():
        raise HTTPException(status_code=400, detail=f"Unknown prompt version: {version}")
    text = (PROMPTS_DIR / f"{version}.md").read_text(encoding="utf-8")
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    system, user = text.split("=== USER ===")
    return system.replace("=== SYSTEM ===", "").strip(), user.strip()


# ---------- output parsing ----------

def parse_description(text: str) -> dict:
    """Pull {"alt_text", "long_description"} out of a model's answer.

    Models sometimes wrap JSON in ``` fences or add a sentence around it.
    """
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.I)
    candidates = [cleaned]
    match = re.search(r"\{.*\}", cleaned, flags=re.S)
    if match:
        candidates.append(match.group(0))
    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        alt = str(data.get("alt_text", "")).strip()
        long = str(data.get("long_description", "")).strip()
        if alt and long:
            return {"alt_text": alt, "long_description": long}
    raise GenerationError("The model's answer was not in the expected format. Try again or choose another model.")


# ---------- API ----------

class Context(BaseModel):
    subject: str = ""
    grade: str = ""
    chapter: str = ""
    caption: str = ""
    extra: str = Field(default="", description="Anything else the model should know")


class DescribeRequest(BaseModel):
    image_base64: str
    media_type: str = "image/png"
    model: str
    prompt_version: str | None = None
    context: Context = Context()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "describe", "models": len(available_models())}


@app.get("/v1/models", dependencies=[Depends(require_token)])
def models() -> dict:
    return {
        "models": [m.public() for m in available_models()],
        "prompt_versions": prompt_versions(),
        "default_prompt": DEFAULT_PROMPT,
    }


@app.post("/v1/describe", dependencies=[Depends(require_token)])
def describe(req: DescribeRequest) -> dict:
    model = find_model(req.model)
    if model is None:
        raise HTTPException(status_code=400, detail=f"Model not available: {req.model}")
    if req.media_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported image type: {req.media_type}")
    try:
        image = base64.b64decode(req.image_base64, validate=True)
    except ValueError:
        raise HTTPException(status_code=400, detail="image_base64 is not valid base64.")
    if not image or len(image) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="The image is empty or larger than 10 MB.")

    version = req.prompt_version or DEFAULT_PROMPT
    system, user_template = load_prompt(version)
    ctx = req.context
    user = user_template.format(
        subject=ctx.subject or "not given",
        grade=ctx.grade or "not given",
        chapter=ctx.chapter or "not given",
        caption=ctx.caption or "not given",
        extra=f"Other notes: {ctx.extra}" if ctx.extra else "",
    ).strip()

    try:
        result = generate(model, system, user, image, req.media_type)
        parsed = parse_description(result.text)
    except GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        **parsed,
        "model": {"id": model.id, "label": model.label, "provider": model.provider, "name": result.model},
        "prompt_version": version,
        "usage": {"input_tokens": result.input_tokens, "output_tokens": result.output_tokens},
        "seconds": result.seconds,
    }
