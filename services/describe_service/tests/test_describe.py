import base64

import pytest
from fastapi.testclient import TestClient

import describe_service.main as svc
from describeit_models import GenerationError, Result

PNG_1PX = base64.b64encode(bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
)).decode()


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SERVICE_TOKEN", "test-token")
    monkeypatch.setenv("OPENAI_API_KEY", "x")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    return TestClient(svc.app)


AUTH = {"X-Service-Token": "test-token"}


def fake_generate(text):
    def _gen(model, system, prompt, image, media_type, max_tokens=4000):
        _gen.calls.append({"model": model, "system": system, "prompt": prompt})
        return Result(text=text, provider=model.provider, model=model.model,
                      input_tokens=10, output_tokens=20, seconds=0.5)
    _gen.calls = []
    return _gen


def test_health_needs_no_token(client):
    assert client.get("/health").json()["status"] == "ok"


def test_v1_routes_need_the_service_token(client):
    assert client.get("/v1/models").status_code == 401
    assert client.get("/v1/models", headers=AUTH).status_code == 200


def test_only_models_with_a_key_are_offered(client):
    ids = [m["id"] for m in client.get("/v1/models", headers=AUTH).json()["models"]]
    assert ids and all(i.startswith("gpt") for i in ids)
    assert "model" not in client.get("/v1/models", headers=AUTH).json()["models"][0], "provider model names stay private"


def test_describe_returns_alt_text_and_long_description(client, monkeypatch):
    gen = fake_generate('```json\n{"alt_text": "A bar magnet", "long_description": "A bar magnet with N and S poles."}\n```')
    monkeypatch.setattr(svc, "generate", gen)
    res = client.post("/v1/describe", headers=AUTH, json={
        "image_base64": PNG_1PX, "model": "gpt-4o",
        "context": {"subject": "Science", "grade": "6", "chapter": "Exploring Magnets"},
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["alt_text"] == "A bar magnet"
    assert body["prompt_version"] == "describe-v1"
    assert body["model"]["label"] == "GPT-4o"
    assert "Exploring Magnets" in gen.calls[0]["prompt"]


def test_unexpected_model_output_is_a_clear_502(client, monkeypatch):
    monkeypatch.setattr(svc, "generate", fake_generate("Sorry, I can't help with that."))
    res = client.post("/v1/describe", headers=AUTH, json={"image_base64": PNG_1PX, "model": "gpt-4o"})
    assert res.status_code == 502
    assert "expected format" in res.json()["detail"]


def test_provider_errors_are_reported_without_crashing(client, monkeypatch):
    def boom(*args, **kwargs):
        raise GenerationError("GPT-4o could not answer: rate limited")
    monkeypatch.setattr(svc, "generate", boom)
    res = client.post("/v1/describe", headers=AUTH, json={"image_base64": PNG_1PX, "model": "gpt-4o"})
    assert res.status_code == 502 and "rate limited" in res.json()["detail"]


def test_bad_input_is_rejected(client):
    assert client.post("/v1/describe", headers=AUTH, json={"image_base64": PNG_1PX, "model": "nope"}).status_code == 400
    assert client.post("/v1/describe", headers=AUTH, json={"image_base64": "%%%", "model": "gpt-4o"}).status_code == 400
    assert client.post("/v1/describe", headers=AUTH,
                       json={"image_base64": PNG_1PX, "model": "gpt-4o", "media_type": "application/pdf"}).status_code == 415
