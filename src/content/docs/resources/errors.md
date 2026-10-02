---
title: Errors
description: REST error format (RFC 9457) and the list of stable error codes.
---

:::note
This catalogue is the REST error model (`application/problem+json`). Other styles reuse the same `code` strings:

- [SOAP Faults](/soap/#faults)
- [JSON-RPC](/rpc/#errors)
- [gRPC status](/grpc/#status-codes)
- [GraphQL `errors[]`](/graphql/#errors)
- [WebSocket close codes](/websocket/#close-codes)
:::

Every REST error response uses `Content-Type: application/problem+json` and the shape defined by [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457), extended with a stable `code` and, for validation errors, a per-field `errors` array.

```json
{
  "type": "https://docs.apiculture.example/resources/errors#validation_failed",
  "title": "Validation failed",
  "status": 422,
  "detail": "`brood_frames` must be between 0 and 20.",
  "instance": "/hives/hv_01J8Z5P2M3N4B5V6C7X8Z9A0S1/inspections",
  "code": "validation_failed",
  "errors": [
    { "field": "brood_frames", "message": "must be between 0 and 20" }
  ]
}
```

| Field | Stable? | Use it for |
| --- | --- | --- |
| `code` | Yes | Branching in code. Codes are never renamed or removed within a major version. |
| `status` | Yes | Retry decisions (see [Idempotency and retries](/rest/guides/idempotency/)). |
| `errors[].field` | Yes | Highlighting the offending input in your UI. |
| `title`, `detail` | No | Logging and showing to developers. Wording may change; do not match on it. |
| `type` | Yes | Linking to this page. |

## Error codes

| `code` | Status | Meaning | What to do |
| --- | --- | --- | --- |
| `malformed_request` | 400 | Body is not valid JSON, or a field has the wrong type. | Fix the request. |
| `invalid_cursor` | 400 | The `cursor` is expired, tampered with, or used with different filters. | Restart pagination from the first page. |
| `unauthenticated` | 401 | Missing, invalid or revoked API key; or a key used against the wrong environment. | Check the key and the host. |
| `not_found` | 404 | The resource does not exist or belongs to another account. | Verify the identifier. |
| `apiary_not_empty` | 409 | Attempt to delete an apiary that still has hives. | Move or delete the hives first. |
| `validation_failed` | 422 | Request is well-formed but violates a rule. Details in `errors`. | Fix the listed fields. |
| `idempotency_key_reused` | 422 | Same `Idempotency-Key` sent with a different body. | Use a new key for a new request. |
| `rate_limited` | 429 | Too many requests. | Wait for `Retry-After`, then retry. |
| `internal_error` | 500 | Something went wrong on our side. | Retry with backoff; contact support with the `instance` value if it persists. |
| `unavailable` | 503 | Planned maintenance or overload. | Retry with backoff. |

New codes may be added at any time. Treat an unknown `code` according to its `status`.
