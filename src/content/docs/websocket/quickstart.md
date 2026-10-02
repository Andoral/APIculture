---
title: Quickstart
description: Subscribe to inspection events over WebSocket.
sidebar:
  order: 1
---

You need a sandbox key and a hive id. Create those over [REST](/rest/quickstart/) (or any write API), then listen here.

## 1. Connect and authenticate

```js
const ws = new WebSocket('ws://127.0.0.1:8787/v1?token=ak_test_local');
ws.onopen = () => {
  ws.send(JSON.stringify({
    op: 'subscribe',
    channel: 'hive.hv_01J8Z5P2M3N4B5V6C7X8Z9A0S1.inspections',
  }));
};
ws.onmessage = (ev) => console.log(JSON.parse(ev.data));
```

Without a query token, send auth as the first frame:

```json
{ "op": "auth", "token": "ak_test_local" }
```

## 2. Record an inspection (any write API)

Use REST `POST /hives/{id}/inspections`, JSON-RPC `createInspection`, and so on. Within a second the socket receives:

```json
{
  "id": "evt_01J8Z6A1B2C3D4E5F6G7H8J9K0",
  "type": "inspection.created",
  "created_at": "2026-09-28T09:30:05Z",
  "data": {
    "id": "in_01J8Z6A1B2C3D4E5F6G7H8J9K0",
    "hive_id": "hv_01J8Z5P2M3N4B5V6C7X8Z9A0S1",
    "inspected_at": "2026-09-28T09:30:00Z",
    "queen_seen": true
  }
}
```

## 3. Keep the socket alive

```js
setInterval(() => ws.send(JSON.stringify({ op: 'ping' })), 30_000);
```

## Next steps

- [Channel reference](/websocket/reference/) · [AsyncAPI](/specs/websocket/v1.yaml)
- Account-wide HTTP delivery: [REST webhooks](/rest/guides/webhooks/)
