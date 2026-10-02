---
title: Idempotency and retries
description: Retry writes safely with Idempotency-Key, and know which errors are worth retrying.
sidebar:
  order: 2
---

Networks fail. A `POST` may time out after the server already created the resource. The `Idempotency-Key` header lets you retry such a request without creating duplicates.

## Using `Idempotency-Key`

Send a unique value (a UUID v4 is ideal) with every `POST` that creates a resource:

```http
POST /v1/hives HTTP/1.1
Authorization: Bearer ak_live_…
Idempotency-Key: 5f2c7a4e-2f1e-4c1a-9d1e-0c1d2e3f4a5b
Content-Type: application/json
```

Behaviour:

- The first request with a given key is processed normally and its response is stored.
- Any later request with the same key **and the same body** within 24 hours returns the stored response (same status, same body) without doing anything.
- The same key with a **different body** returns `422 idempotency_key_reused`.
- Keys are scoped per API key; two accounts can use the same value without interfering.

`GET`, `PATCH` and `DELETE` are naturally idempotent and ignore the header.

## Which errors to retry

| Status | Retry? | How |
| --- | --- | --- |
| `408`, `5xx`, network error | Yes | Exponential backoff with jitter, same `Idempotency-Key`. |
| `429` | Yes | Wait for `Retry-After` seconds, then retry. |
| `400`, `401`, `404`, `409`, `422` | No | Fix the request; retrying the same input gives the same result. |

## Reference implementation

```ts
async function withRetry<T>(fn: () => Promise<Response>, attempts = 5): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fn().catch(() => undefined);
    if (res && res.status < 500 && res.status !== 429 && res.status !== 408) return res;
    if (i >= attempts - 1) throw new Error('gave up');
    const retryAfter = Number(res?.headers.get('Retry-After')) || 0;
    const backoff = Math.min(30_000, 500 * 2 ** i) * (0.5 + Math.random());
    await new Promise((r) => setTimeout(r, Math.max(retryAfter * 1000, backoff)));
  }
}
```
