import base64
import os
import time
from dataclasses import dataclass

from .catalogue import KEY_ENV, ModelInfo


class GenerationError(Exception):
    """The provider failed or returned nothing usable. The message is safe to show."""


@dataclass
class Result:
    text: str
    provider: str
    model: str
    input_tokens: int | None
    output_tokens: int | None
    seconds: float


def _key(provider: str) -> str:
    key = os.environ.get(KEY_ENV[provider], "").strip()
    if not key:
        raise GenerationError(f"No API key is set for {provider}.")
    return key


def _openai(m: ModelInfo, system: str, prompt: str, image: bytes, media_type: str, max_tokens: int):
    from openai import OpenAI

    client = OpenAI(api_key=_key("openai"))
    data_url = f"data:{media_type};base64,{base64.b64encode(image).decode()}"
    resp = client.responses.create(
        model=m.model,
        instructions=system,
        max_output_tokens=max_tokens,
        input=[{
            "role": "user",
            "content": [
                {"type": "input_image", "image_url": data_url},
                {"type": "input_text", "text": prompt},
            ],
        }],
    )
    usage = getattr(resp, "usage", None)
    return resp.output_text, getattr(usage, "input_tokens", None), getattr(usage, "output_tokens", None)


def _anthropic(m: ModelInfo, system: str, prompt: str, image: bytes, media_type: str, max_tokens: int):
    import anthropic

    client = anthropic.Anthropic(api_key=_key("anthropic"))
    resp = client.messages.create(
        model=m.model,
        max_tokens=max_tokens,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type,
                                             "data": base64.b64encode(image).decode()}},
                {"type": "text", "text": prompt},
            ],
        }],
    )
    text = "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")
    return text, resp.usage.input_tokens, resp.usage.output_tokens


def _google(m: ModelInfo, system: str, prompt: str, image: bytes, media_type: str, max_tokens: int):
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_key("google"))
    resp = client.models.generate_content(
        model=m.model,
        contents=[types.Part.from_bytes(data=image, mime_type=media_type), prompt],
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
        ),
    )
    usage = getattr(resp, "usage_metadata", None)
    return (resp.text or ""), getattr(usage, "prompt_token_count", None), getattr(usage, "candidates_token_count", None)


_CALLERS = {"openai": _openai, "anthropic": _anthropic, "google": _google}


def generate(model: ModelInfo, system: str, prompt: str, image: bytes, media_type: str,
             max_tokens: int = 4000) -> Result:
    """Send one image with instructions to a model and return its text."""
    caller = _CALLERS.get(model.provider)
    if caller is None:
        raise GenerationError(f"Unknown provider: {model.provider}")
    started = time.monotonic()
    try:
        text, tokens_in, tokens_out = caller(model, system, prompt, image, media_type, max_tokens)
    except GenerationError:
        raise
    except Exception as exc:  # provider SDK errors: keep the provider's message, drop the stack
        raise GenerationError(f"{model.label} could not answer: {exc}") from exc
    if not text or not text.strip():
        raise GenerationError(f"{model.label} returned an empty answer.")
    return Result(text=text, provider=model.provider, model=model.model,
                  input_tokens=tokens_in, output_tokens=tokens_out,
                  seconds=round(time.monotonic() - started, 2))
