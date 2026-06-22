# Socket API CORS Proxy (AWS Lambda)

`api.socket.dev` doesn't return CORS headers, so the browser-based
[Socket Supply-Chain Risk Scanner](../../code/socket-demo/) can't call it
directly. This Lambda sits behind a **Function URL** and forwards requests to
Socket — and only to Socket.

## Security model

- **Host allowlist.** Requests are only forwarded if the `?url=` target starts
  with `https://api.socket.dev/`. The trailing slash pins the authority to
  exactly that host (defeats `@`-userinfo and subdomain-suffix bypasses).
- **No redirect following** (`redirect: 'manual'`) so a 3xx can't bounce the
  request off the allowlisted host.
- **No secrets stored.** The caller supplies their own Socket API key in the
  `Authorization` header; it's forwarded and never persisted.

## Deploy

Paste `index.js` into the Lambda console (runtime: Node.js 18+ for built-in
`fetch` / `AbortSignal.timeout`). Then apply the two AWS-side guards below.

### Cost guard — reserved concurrency (the rate cap)

WAF can't attach directly to a Function URL, so reserved concurrency is the
simplest way to bound worst-case spend if the public URL is abused:

```bash
aws lambda put-function-concurrency \
  --function-name <FUNCTION_NAME> \
  --reserved-concurrent-executions 5
```

### Lock CORS to the site origin

```bash
aws lambda update-function-url-config \
  --function-name <FUNCTION_NAME> \
  --cors '{"AllowOrigins":["https://julianchuan.com"],"AllowMethods":["GET","POST"],"AllowHeaders":["authorization","content-type"]}'
```
