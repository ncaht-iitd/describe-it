"""Shared model package for the Describe-it services.

One way to send "an image + instructions" to any vision model and get text back,
with the same result shape for every provider. Used by the Describe service now,
and by the Tactile and Playground services later.

Which models exist is configured in models.json (or the MODELS_FILE setting),
so model names can change without code changes. A model only shows as available
when its provider's API key is set.
"""
from .catalogue import ModelInfo, available_models, find_model, load_catalogue
from .providers import GenerationError, Result, generate

__all__ = [
    "ModelInfo", "available_models", "find_model", "load_catalogue",
    "GenerationError", "Result", "generate",
]
