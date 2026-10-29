import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path

# Environment variable that holds each provider's API key
KEY_ENV = {
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "google": "GEMINI_API_KEY",
}

DEFAULT_FILE = Path(__file__).with_name("models.json")


@dataclass(frozen=True)
class ModelInfo:
    id: str          # stable id used by the website, e.g. "claude-sonnet"
    label: str       # what people see, e.g. "Claude Sonnet"
    provider: str    # "openai" | "anthropic" | "google"
    model: str       # the provider's model name
    note: str = ""   # short hint shown under the model menu

    def public(self) -> dict:
        data = asdict(self)
        data.pop("model")
        return data


def load_catalogue() -> list[ModelInfo]:
    path = Path(os.environ.get("MODELS_FILE") or DEFAULT_FILE)
    entries = json.loads(path.read_text(encoding="utf-8"))
    return [ModelInfo(**entry) for entry in entries]


def has_key(provider: str) -> bool:
    return bool(os.environ.get(KEY_ENV.get(provider, ""), "").strip())


def available_models() -> list[ModelInfo]:
    """Models whose provider has an API key configured."""
    return [m for m in load_catalogue() if has_key(m.provider)]


def find_model(model_id: str) -> ModelInfo | None:
    return next((m for m in available_models() if m.id == model_id), None)
