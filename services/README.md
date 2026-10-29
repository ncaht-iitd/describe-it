# Describe-it services

Python services that the website reaches through the gateway (`server/`). Each one runs,
deploys and is tested on its own. See the architecture plan for how they fit together.

| Folder | What it is |
|---|---|
| `describeit_models/` | Shared model package: one way to call OpenAI, Anthropic and Gemini. Models are listed in `models.json`. |
| `describe_service/` | Describe service: alt text + long description for one image. |

## Run locally

From this `services` folder:

```bash
python -m venv .venv
.venv/Scripts/pip install -r describe_service/requirements.txt   # macOS/Linux: .venv/bin/pip
cp describe_service/.env.example describe_service/.env           # then add your keys
.venv/Scripts/python -m uvicorn describe_service.main:app --port 8001
```

Check it: <http://localhost:8001/health>. The gateway finds it through `DESCRIBE_SERVICE_URL`
in `server/.env` (default `http://localhost:8001`); `SERVICE_TOKEN` must be the same in both.

Check that every model in `models.json` exists for your keys:

```bash
.venv/Scripts/python -m describeit_models.check_models
```

Run the tests: `.venv/Scripts/python -m pytest -q`

## Change the prompt

Copy `describe_service/prompts/describe-v1.md` to `describe-v2.md`, edit it, and set
`DEFAULT_PROMPT=describe-v2`. Every generated description records the prompt version it used.

## Deploy on Render (one web service per service)

- Root directory: `services`
- Build command: `pip install -r describe_service/requirements.txt`
- Start command: `uvicorn describe_service.main:app --host 0.0.0.0 --port $PORT`
- Environment: `SERVICE_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`

Then set `DESCRIBE_SERVICE_URL` (the service's Render address) and the same `SERVICE_TOKEN`
on the gateway (backend) service.
