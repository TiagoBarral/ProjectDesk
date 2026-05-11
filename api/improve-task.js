const MAX_INPUT_LENGTH = 300;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const rateLimitStore = new Map();
const TITLE_ACRONYMS = new Set(['ai', 'api', 'css', 'html', 'json', 'pwa', 'rls', 'sql', 'ui', 'ux']);

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
  const parts = [];
  for (const content of responseBody.content || []) {
    if (typeof content.text === 'string') parts.push(content.text);
  }

  if (typeof responseBody.output_text === 'string') parts.push(responseBody.output_text);

  for (const item of responseBody.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }

  return parts.join(' ');
}

function stripJsonFence(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseImprovement(text) {
  const cleanedText = stripJsonFence(text);
  const jsonStart = cleanedText.indexOf('{');
  const jsonEnd = cleanedText.lastIndexOf('}');
  const jsonText = jsonStart >= 0 && jsonEnd > jsonStart
    ? cleanedText.slice(jsonStart, jsonEnd + 1)
    : cleanedText;

  return JSON.parse(jsonText);
}

function cleanLine(text, maxLength) {
  return text
    .replace(/^["'`]+|["'`.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanDescription(text) {
  return text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

function normalizeTitleForComparison(text) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function polishFallbackTitle(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const normalized = word.toLowerCase();
      if (TITLE_ACRONYMS.has(normalized)) return normalized.toUpperCase();
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(' ')
    .slice(0, MAX_TITLE_LENGTH);
}

function getAnthropicModel() {
  const configuredModel = String(process.env.ANTHROPIC_MODEL || '').trim();
  if (!configuredModel || configuredModel === 'undefined' || configuredModel === 'null') {
    return DEFAULT_MODEL;
  }
  return configuredModel;
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
  const description = String(body?.description || '').trim();
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
        model: getAnthropicModel(),
        max_tokens: 220,
        system: [
          'Rewrite rough tasks into one concise title and one useful description.',
          'Return only valid compact JSON with this exact shape: {"title":"...","description":"..."}',
          `Use ${MAX_TITLE_LENGTH} characters or fewer for title.`,
          `Use ${MAX_DESCRIPTION_LENGTH} characters or fewer for description.`,
          'The title must be rewritten into a polished action phrase, not copied verbatim from the input.',
          'Fix spelling, casing, and word order in the title when needed.',
          'The description should be practical: one or two short sentences explaining the task outcome or next step.',
          'Keep the user language if it is clear.',
          'Do not invent dates, people, project names, or extra details.',
          'Do not use markdown, bullets, or explanations outside the JSON.',
        ].join(' '),
        messages: [
          {
            role: 'user',
            content: [
              `Task title: ${title}`,
              description ? `Current description: ${description}` : 'Current description: none',
            ].join('\n'),
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

    let improvement;
    try {
      improvement = parseImprovement(extractOutputText(responseBody));
    } catch {
      sendJson(response, 502, { error: 'AI returned an unreadable suggestion.' });
      return;
    }

    let improvedTitle = cleanLine(String(improvement.title || ''), MAX_TITLE_LENGTH);
    const improvedDescription = cleanDescription(String(improvement.description || ''));
    const fallbackTitle = polishFallbackTitle(title);
    if (
      fallbackTitle
      && normalizeTitleForComparison(improvedTitle) === normalizeTitleForComparison(title)
      && fallbackTitle !== title
    ) {
      improvedTitle = fallbackTitle;
    }

    if (!improvedTitle || !improvedDescription) {
      sendJson(response, 502, { error: 'AI did not return a complete suggestion.' });
      return;
    }

    sendJson(response, 200, { improvedTitle, improvedDescription });
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'AI improvement timed out. Try again.'
      : 'AI improvement failed.';
    sendJson(response, 504, { error: message });
  } finally {
    clearTimeout(timeout);
  }
}
