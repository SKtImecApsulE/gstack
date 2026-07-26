# Feasibility Checker

A tiny full-stack web app: type any request or goal, get an instant verdict on
whether it's possible, with a confidence score and reasoning.

## Run it

```bash
bun run feasibility            # from the repo root, serves on http://localhost:3000
# or directly:
bun run feasibility-checker/server.ts
PORT=8080 bun run feasibility-checker/server.ts   # custom port
```

No build step, no dependencies beyond Bun itself.

## Two verdict engines

| Engine | When | What you get |
|--------|------|--------------|
| **Claude AI** | `ANTHROPIC_API_KEY` is set on the server | Real AI judgment of physical, logical, technological, and practical feasibility (model: `claude-haiku-4-5`, override with `FEASIBILITY_MODEL`) |
| **Built-in analyzer** | No API key | Pattern-based verdicts covering physics violations, logical impossibilities, and common achievable goals |

If the Claude call fails at runtime, the server automatically falls back to the
built-in analyzer, so the site never breaks.

## API

`POST /api/check` with `{"request": "your goal here"}` returns:

```json
{
  "verdict": "POSSIBLE | NOT_POSSIBLE | UNCERTAIN",
  "confidence": 92,
  "reasoning": "Plain-language explanation.",
  "engine": "claude | heuristic"
}
```

`GET /api/health` returns `{"ok": true, "engine": "claude" | "heuristic"}`.

## Deploy to Railway

The repo ships deploy config: `railway.json` at the repo root points Railway at
`feasibility-checker/Dockerfile`, which builds a slim image containing only this
app (none of the monorepo's dev dependencies).

1. Go to [railway.com/new](https://railway.com/new) → **Deploy from GitHub repo**
   → pick this repo and branch.
2. Railway detects `railway.json` and builds the Dockerfile automatically.
3. In the service's **Variables** tab, add `ANTHROPIC_API_KEY` for AI verdicts
   (optional — the heuristic engine answers without it).
4. In **Settings → Networking**, click **Generate Domain** to get a public URL.

Health checks hit `/api/health`. The server reads Railway's `PORT` automatically.

## Files

- `server.ts` — Bun server: static frontend + `/api/check` + Claude integration
- `analyzer.ts` — heuristic fallback engine
- `public/index.html` — the whole frontend (single file, zero frameworks)
