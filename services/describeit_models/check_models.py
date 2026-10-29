"""Check that every model in models.json exists for the API keys you have set.

    python -m describeit_models.check_models          (run from the services folder)

Prints one line per model: OK, MISSING (the provider doesn't offer that name) or
NO KEY. For MISSING models it lists similar names the provider does offer.
"""
import difflib
import os

from dotenv import load_dotenv

from .catalogue import KEY_ENV, load_catalogue


def provider_models(provider: str) -> list[str]:
    key = os.environ.get(KEY_ENV[provider], "").strip()
    if provider == "openai":
        from openai import OpenAI
        return [m.id for m in OpenAI(api_key=key).models.list().data]
    if provider == "anthropic":
        import anthropic
        return [m.id for m in anthropic.Anthropic(api_key=key).models.list(limit=100).data]
    if provider == "google":
        from google import genai
        return [m.name.removeprefix("models/") for m in genai.Client(api_key=key).models.list()]
    return []


def main() -> None:
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "describe_service", ".env"))
    cache: dict[str, list[str]] = {}
    for m in load_catalogue():
        if not os.environ.get(KEY_ENV[m.provider], "").strip():
            print(f"NO KEY   {m.label:22} ({m.provider}: set {KEY_ENV[m.provider]})")
            continue
        if m.provider not in cache:
            cache[m.provider] = provider_models(m.provider)
        names = cache[m.provider]
        if m.model in names:
            print(f"OK       {m.label:22} {m.model}")
        else:
            close = difflib.get_close_matches(m.model, names, n=4, cutoff=0.5)
            print(f"MISSING  {m.label:22} {m.model}  -> try: {', '.join(close) or 'see provider docs'}")


if __name__ == "__main__":
    main()
