---
title: Authentication
description: How to authenticate requests with API keys, and how to keep them safe.
sidebar:
  order: 2
---

Every request must carry an API key in the `Authorization` header using the Bearer scheme:

```http
GET /v1/apiaries HTTP/1.1
Host: api.apiculture.example
Authorization: Bearer ak_live_3f9a…
```

## Key types

| Prefix | Environment | Notes |
| --- | --- | --- |
| `ak_test_` | Sandbox | Isolated test data. Rejected by production hosts with `401`. |
| `ak_live_` | Production | Real data. Rejected by the sandbox host with `401`. |

Keys are scoped to a single account. A request made with a key only sees resources that belong to that account; anything else returns `404`, not `403`, so that resource identifiers cannot be probed.

## Failure modes

| Status | `code` | Meaning |
| --- | --- | --- |
| `401` | `unauthenticated` | Header missing, malformed, key revoked, or key used against the wrong environment. |
| `429` | `rate_limited` | Too many requests for this key. Honour `Retry-After`. |

All error bodies share one shape; see [Errors](/resources/errors/).

## Keeping keys safe

- Store keys in a secrets manager or environment variables, never in source control.
- Call the API from your server. Browser and mobile clients must not hold a key.
- Rotate keys from the dashboard. A newly created key works immediately; the old one keeps working until you revoke it, so rotation needs no downtime.
- Create one key per integration so that a leak can be contained by revoking a single key.
