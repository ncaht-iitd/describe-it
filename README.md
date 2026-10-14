# Describe-it (formerly VisionText)

An accessible library of educational diagrams for people with visual impairments. It provides detailed descriptions of NCERT textbook diagrams (Classes 6–8: Science, Mathematics, Social Science), follow-up questions answered by AI, and downloadable tactile versions for selected diagrams.

Built at NCAHT, IIT Delhi.

## What's in this repo

| Folder | What it is |
|---|---|
| `frontend/` | React + Vite web app (the site users see) |
| `server/` | Node.js + Express API, MongoDB models, OpenAI calls |
| `server/dataset/` | Source spreadsheets and diagram images, one folder per subject/class/chapter |
| `server/scripts/` | One-off maintenance scripts for the database and storage |

## Run it locally

You need Node.js 20 or newer.

**1. API server**

```bash
cd server
cp .env.example .env    # then fill in the values
npm install
npm start               # http://localhost:5000
```

**2. Website** (in a second terminal)

```bash
cd frontend
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:5173
```

The site calls the API at `VITE_BACKEND_URL`. Library search works with just MongoDB; login and tactile requests also need the Appwrite settings.

## Branches

- `main` is what is deployed. Don't push to it directly.
- `dev` is where work happens. Changes reach `main` through a pull request once checked.

## Status

The project is being modernised. Work in progress:

- Fixing library search and making it fully usable by keyboard and screen reader
- Adding automated tests and checks
- Planned: alt text and long descriptions with review and approval, model evaluation (AccessGen), and tactile graphic generation and editing
