---
title: WebSocket
description: Event API documented from AsyncAPI.
---

WebSocket is the live counterpart of REST [webhooks](/rest/guides/webhooks/): you subscribe to channels and the server pushes JSON events. The machine-readable contract is **AsyncAPI 3**.

| | |
| --- | --- |
| **Contract** | [`specs/websocket/v1/asyncapi.yaml`](https://github.com/Andoral/APIculture/blob/main/specs/websocket/v1/asyncapi.yaml) · [`/specs/websocket/v1.yaml`](/specs/websocket/v1.yaml) |
| **Reference** | [Channels](/websocket/reference/) · [AsyncAPI explorer](/reference/websocket/v1/) |
| **Host** | `ws://127.0.0.1:8787/v1` ([local sandbox](/getting-started/sandbox/)) · `wss://sandbox.ws.apiculture.example/v1` |

[Quickstart](/websocket/quickstart/) · [Authentication](/getting-started/authentication/)

This style is **receive-mostly**. Creating apiaries still happens over REST, JSON-RPC, gRPC, GraphQL or SOAP; WebSocket tells you when something changed.

## Conventions

- Protocol `wss`. Text frames, JSON payloads.
- Auth: `?token=ak_…` on the URL **or** a first `{ "op": "auth", "token": "ak_…" }` frame within 5 seconds.
- Subscribe with `{ "op": "subscribe", "channel": "hive.{hiveId}.inspections" }`. Wildcards are not supported; subscribe per hive or use REST webhooks for account-wide delivery.
- Events use the same envelope as REST webhooks: `id`, `type`, `created_at`, `data`.
- At-least-once delivery. De-duplicate on `id`.
- Ping every 30s (`{ "op": "ping" }`); the server replies `{ "op": "pong" }`. Miss three pongs and the socket is closed.

## Close codes

| Code | Meaning |
| --- | --- |
| `1000` | Client unsubscribe / shutdown. |
| `4001` | Missing or invalid token. |
| `4003` | Subscribed to a hive you cannot see. |
| `4008` | No ping in time. |
| `4029` | Rate limited (too many subscribe ops). |
