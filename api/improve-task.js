const MAX_INPUT_LENGTH = 300;
const MAX_OUTPUT_LENGTH = 160;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const REQUEST_TIMEOUT_MS = 10000;
const rateLimitStore = new Map();

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function getClientKey(request) {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.socket?.remoteAddress || 'unknown';
}

function isRateLimited(request) {
  const now = Date.now();
  const key = getClientKey(request);
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

async function readJsonBody(request) {
  if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString('utf8') || '{}');
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function extractOutputText(responseBody) {
  if (typeof responseBody.output_text === 'string') return responseBody.output_text;

  const parts = [];
  for (const item of responseBody.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join(' ');
}

function cleanTaskTitle(text) {
  return text
    .replace(/^["'`]+|["'`.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_OUTPUT_LENGTH);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  if (isRateLimited(request)) {
    sendJson(response, 429, { error: 'Too many improvement requests. Try again later.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(response, 503, { error: 'AI improvement is not configured yet.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: 'Invalid request body.' });
    return;
  }

  const title = String(body?.title || '').trim();
  if (!title) {
    sendJson(response, 400, { error: 'Enter a task title to improve.' });
    return;
  }

  if (title.length > MAX_INPUT_LENGTH) {
    sendJson(response, 400, { error: `Task title must be ${MAX_INPUT_LENGTH} characters or less.` });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: [
          'Rewrite rough task titles into one concise, actionable task title.',
          'Return only the improved title.',
          `Use ${MAX_OUTPUT_LENGTH} characters or fewer.`,
          'Keep the user language if it is clear.',
          'Do not invent dates, people, project names, or extra details.',
          'Do not use quotes, markdown, bullets, or explanations.',
        ].join(' '),
        messages: [
          {
            role: 'user',
            content: `Improve this task title: ${title}`,
          },
        ],
      }),
    });

    const responseBody = await anthropicResponse.json().catch(() => ({}));
    if (!anthropicResponse.ok) {
      sendJson(response, anthropicResponse.status >= 500 ? 502 : anthropicResponse.status, {
        error: responseBody.error?.message || responseBody.message || 'AI improvement failed.',
      });
      return;
    }

    const improvedTitle = cleanTaskTitle(extractOutputText(responseBody));
    if (!improvedTitle) {
      sendJson(response, 502, { error: 'AI did not return an improved title.' });
      return;
    }

    sendJson(response, 200, { improvedTitle });
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'AI improvement timed out. Try again.'
      : 'AI improvement failed.';
    sendJson(response, 504, { error: message });
  } finally {
    clearTimeout(timeout);
  }
}
