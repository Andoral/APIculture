---
title: Local sandbox
description: Run the in-memory APIculture sandbox and call every HTTP style from your machine.
sidebar:
  order: 3
---

The sandbox is a small Node server in `sandbox/`. It implements the same apiary / hive / inspection store over REST, SOAP, JSON-RPC, GraphQL and WebSocket so you can exercise the docs — including Scalar **Test request** — without a hosted API.

gRPC is **not** served here. It needs HTTP/2 and generated stubs; use the [`.proto` file](/grpc/) against your own process.

## Start it

From the repository root, with the docs already installed:

```bash
npm run sandbox
```

It listens on `http://127.0.0.1:8787` and prints the paths for each style.

| Style | URL |
| --- | --- |
| REST | `http://127.0.0.1:8787/v1` |
| SOAP | `http://127.0.0.1:8787/soap/v1` |
| JSON-RPC | `http://127.0.0.1:8787/rpc/v1` |
| GraphQL | `http://127.0.0.1:8787/graphql` |
| WebSocket | `ws://127.0.0.1:8787/v1` |

## Authenticate

Any `Authorization: Bearer ak_test_…` value is accepted. Each distinct key gets its own empty store, so two keys cannot see each other's apiaries. `ak_live_…` is rejected with `401` — this process is sandbox-only.

There is no dashboard. `ak_test_local` is a fine key for local work.

## Try it from the docs

1. Run `npm run dev` and `npm run sandbox`.
2. Open [REST Reference v1](/reference/rest/v1/).
3. Choose the **Local sandbox** server.
4. Set the bearer token to `ak_test_local` and send a request.

The sandbox sends CORS `*` headers, so the browser talks to it directly.

## Behaviour

- Data lives in memory and disappears when the process exits.
- Cursor pagination, `Idempotency-Key`, RFC 9457 Problem Details and `X-RateLimit-Remaining` match the REST contract.
- Webhook endpoints are stored, but the sandbox **does not** HTTP POST to them (no side effects outside your machine). The same events are pushed to WebSocket subscribers.
- Rate limit: 120 requests per key per rolling minute.

The fictional hosts in the contracts (`sandbox.api.apiculture.example`, …) stay as documentation defaults. They are not this process.
