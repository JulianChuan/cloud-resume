// AWS Lambda (Function URL) — CORS proxy for the Socket Supply-Chain Risk Scanner.
//
// The browser can't call api.socket.dev directly (it sends no CORS headers), so
// this function forwards requests to Socket — and ONLY to Socket. Every other
// host is rejected. The visitor's Socket API key rides through in the
// Authorization header and is never stored.
//
// CORS response headers (Access-Control-Allow-Origin, etc.) are configured on
// the Function URL itself, not in this code.

const ALLOWED_PREFIX = 'https://api.socket.dev/';
const FETCH_TIMEOUT_MS = 25_000; // stay under the Lambda's own timeout

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const target = event.queryStringParameters?.url;

  if (!target) {
    return json(400, { error: 'Missing "url" query parameter.' });
  }

  // The trailing slash in ALLOWED_PREFIX is load-bearing: it pins the URL's
  // authority to exactly "api.socket.dev". It defeats the userinfo trick
  // (https://api.socket.dev/@evil.com → host is still api.socket.dev) and the
  // subdomain-suffix trick (https://api.socket.dev.evil.com/ fails startsWith).
  if (!target.startsWith(ALLOWED_PREFIX)) {
    return json(403, { error: 'Only Socket.dev API URLs are permitted.' });
  }

  const headers = event.headers || {};
  const auth = headers.authorization || headers.Authorization;
  const contentType = headers['content-type'] || headers['Content-Type'];

  // Function URLs may base64-encode the body; decode it before forwarding.
  let body;
  if (event.body) {
    body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
  }

  try {
    const res = await fetch(target, {
      method,
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(contentType ? { 'Content-Type': contentType } : {}),
        Accept: 'application/json, application/x-ndjson',
      },
      ...(body ? { body } : {}),
      // Don't chase redirects: a 3xx pointing off api.socket.dev would bypass
      // the allowlist (SSRF). Fail closed instead of following it.
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
      body: text,
    };
  } catch (err) {
    // Don't echo internal error detail back to the caller.
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return json(timedOut ? 504 : 502, {
      error: timedOut ? 'Socket.dev API timed out.' : 'Failed to reach Socket.dev API.',
    });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}
