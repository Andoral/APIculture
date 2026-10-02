---
title: Rate limits
description: How many requests you can make, how to see your remaining budget, and what to do when you hit the limit.
sidebar:
  order: 4
---

Limits are enforced **per API key** using a sliding one-minute window.

| Environment | Reads (`GET`) | Writes (`POST`, `PATCH`, `DELETE`) |
| --- | --- | --- |
| Production | 600 / minute | 120 / minute |
| Sandbox | 120 / minute | 60 / minute |

## Headers

Every response carries the current state of your budget:

| Header | Meaning |
| --- | --- |
| `X-RateLimit-Limit` | Requests allowed in the window. |
| `X-RateLimit-Remaining` | Requests left in the current window. |
| `X-RateLimit-Reset` | Unix timestamp when the window resets. |
| `Retry-After` | Only on `429`: seconds to wait before retrying. |

## When you exceed the limit

You receive `429 Too Many Requests` with a [Problem](/resources/errors/) body and `code: rate_limited`. Wait for `Retry-After` seconds, then retry the same request — see [Idempotency and retries](/rest/guides/idempotency/).

## Staying under the limit

- Use webhooks instead of polling for changes.
- Request the maximum page size (`limit=100`) when iterating over lists.
- Cache responses for resources that rarely change (apiaries) and refresh them on `hive.status_changed` / `apiary.deleted` events.
- If your integration legitimately needs a higher limit, contact support with your expected request pattern.
