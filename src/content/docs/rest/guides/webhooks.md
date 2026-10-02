---
title: Webhooks
description: Receive events when data changes, and verify that they really came from APIculture.
sidebar:
  order: 3
---

Instead of polling, register an HTTPS endpoint and APIculture will `POST` an event to it whenever something you care about happens.

## Events

| Type | When |
| --- | --- |
| `inspection.created` | An inspection was recorded for a hive. |
| `hive.status_changed` | A hive moved to a new [lifecycle status](/#hive-lifecycle). |
| `apiary.deleted` | An apiary was deleted. |

## Registering an endpoint

```bash
curl -X POST http://127.0.0.1:8787/v1/webhooks \
  -H "Authorization: Bearer ak_test_local" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://example.com/hooks/apiculture", "events": ["inspection.created"] }'
```

The response includes a `secret`. It is shown **only once** — store it now.

## Payload

```json
{
  "id": "evt_01J8Z6A1B2C3D4E5F6G7H8J9K0",
  "type": "inspection.created",
  "created_at": "2026-09-28T09:30:05Z",
  "data": { "id": "in_01J8…", "hive_id": "hv_01J8…", "inspected_at": "2026-09-28T09:30:00Z", "queen_seen": true }
}
```

Headers on every delivery:

| Header | Purpose |
| --- | --- |
| `APIculture-Signature` | `t=<unix seconds>,v1=<hex HMAC-SHA256>` |
| `APIculture-Event-Id` | Same as `id` in the body; use it for de-duplication. |

## Verifying signatures

Compute `HMAC-SHA256(secret, "<t>.<raw body>")` and compare it to `v1` using a constant-time comparison. Reject deliveries whose `t` is older than five minutes to prevent replay.

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(signatureHeader.split(',').map((kv) => kv.split('=')));
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
```

Verify against the **raw** request body. Parsing and re-serialising the JSON will change byte order or whitespace and break the signature.

## Delivery guarantees

- Respond with any `2xx` within 10 seconds. Do the heavy work asynchronously.
- Non-`2xx` responses and timeouts are retried with exponential backoff for up to 24 hours.
- Events are delivered **at least once** and may arrive out of order. Make handlers idempotent using `APIculture-Event-Id`.
