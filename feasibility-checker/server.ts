// Feasibility Checker — single-file Bun server.
// Serves the static frontend and exposes POST /api/check.
//
//   bun run feasibility-checker/server.ts          (or: bun run feasibility)
//   PORT=8080 bun run feasibility-checker/server.ts
//
// With ANTHROPIC_API_KEY set, verdicts come from Claude. Without it, the
// built-in heuristic analyzer answers, so the site works out of the box.

import { analyzeHeuristic, type Verdict } from './analyzer';
import indexHtml from './public/index.html' with { type: 'text' };

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.FEASIBILITY_MODEL || 'claude-haiku-4-5-20251001';
const MAX_REQUEST_CHARS = 2000;

async function analyzeWithClaude(request: string): Promise<Verdict> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system:
        'You are a feasibility judge. The user states a request or goal. Decide whether it is possible. ' +
        'Respond with ONLY a JSON object, no markdown fences, with exactly these keys: ' +
        '"verdict" (one of "POSSIBLE", "NOT_POSSIBLE", "UNCERTAIN"), ' +
        '"confidence" (integer 0-100), ' +
        '"reasoning" (2-4 plain sentences explaining the verdict in practical terms), ' +
        '"advice" (2-4 sentences of genuinely useful guidance: if POSSIBLE, the concrete first steps; ' +
        'if NOT_POSSIBLE, name the closest realistic alternative that serves the same underlying goal; ' +
        'if UNCERTAIN, what would have to change or be true for it to work). ' +
        'Judge physical, logical, technological, and practical feasibility. ' +
        'Be decisive: reserve UNCERTAIN for genuinely open questions. ' +
        'For absurd requests, stay good-humored but give real physics and a real alternative.',
      messages: [{ role: 'user', content: request }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  const text = data.content.find((b) => b.type === 'text')?.text ?? '';
  const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));

  const verdict = ['POSSIBLE', 'NOT_POSSIBLE', 'UNCERTAIN'].includes(parsed.verdict)
    ? parsed.verdict
    : 'UNCERTAIN';
  return {
    verdict,
    confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 50))),
    reasoning: String(parsed.reasoning || 'No reasoning provided.'),
    advice: String(parsed.advice || ''),
    engine: 'claude',
  };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/check' && req.method === 'POST') {
      let request: string;
      try {
        const body = (await req.json()) as { request?: unknown };
        request = String(body.request ?? '').trim();
      } catch {
        return json({ error: 'Invalid JSON body.' }, 400);
      }
      if (!request) return json({ error: 'Request text is required.' }, 400);
      if (request.length > MAX_REQUEST_CHARS) {
        return json({ error: `Request too long (max ${MAX_REQUEST_CHARS} characters).` }, 400);
      }

      if (API_KEY) {
        try {
          return json(await analyzeWithClaude(request));
        } catch (err) {
          console.error('Claude analysis failed, falling back to heuristic:', err);
        }
      }
      return json(analyzeHeuristic(request));
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, engine: API_KEY ? 'claude' : 'heuristic' });
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(indexHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    return new Response('Not found', { status: 404 });
  },
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

console.log(
  `Feasibility Checker running at http://localhost:${server.port} ` +
    `(engine: ${API_KEY ? `claude via ${MODEL}` : 'heuristic — set ANTHROPIC_API_KEY for AI verdicts'})`,
);
