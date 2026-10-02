---
title: JSON-RPC
description: JSON-RPC 2.0 API documented from OpenRPC.
---

JSON-RPC exposes the same domain as named procedures. Method names are the REST `operationId`s (`listApiaries`, `createHive`, …). The machine-readable contract is **OpenRPC**.

| | |
| --- | --- |
| **Contract** | [`specs/rpc/v1/openrpc.json`](https://github.com/Andoral/APIculture/blob/main/specs/rpc/v1/openrpc.json) · [`/specs/rpc/v1.json`](/specs/rpc/v1.json) |
| **Reference** | [Methods](/rpc/reference/) |
| **Host** | `http://127.0.0.1:8787/rpc/v1` ([local sandbox](/getting-started/sandbox/)) · `https://sandbox.api.apiculture.example/rpc/v1` |

[Quickstart](/rpc/quickstart/) · [Authentication](/getting-started/authentication/) · [REST equivalent](/rest/)

## Conventions

- JSON-RPC **2.0** over HTTPS `POST`. `Content-Type: application/json`.
- One method per HTTP request. Batch arrays are **not** supported.
- `Authorization: Bearer ak_…` on the HTTP request, not inside the JSON-RPC envelope.
- Params are a **by-name object** (`"params": { "name": "…" }`), never a positional array.
- Cursor pagination uses `limit` / `cursor` / `next_cursor`, same as REST.

## Errors

Application errors use JSON-RPC `error.code` in the reserved implementation range, with `error.data.code` equal to the REST machine code.

| JSON-RPC `error.code` | `data.code` | Meaning |
| --- | --- | --- |
| `-32600` | `malformed_request` | Envelope is not valid JSON-RPC. |
| `-32601` | — | Unknown method. |
| `-32602` | `validation_failed` | Bad params. |
| `-32001` | `unauthenticated` | Missing or invalid API key. |
| `-32004` | `not_found` | Resource missing. |
| `-32009` | `apiary_not_empty` | Delete blocked. |
| `-32029` | `rate_limited` | Honour `Retry-After` on the HTTP response. |
