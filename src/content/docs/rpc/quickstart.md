---
title: Quickstart
description: Create an apiary over JSON-RPC in a few requests.
sidebar:
  order: 1
---

You need a sandbox key (`ak_test_…`) — see [Authentication](/getting-started/authentication/).

## 1. List apiaries

```bash
curl http://127.0.0.1:8787/rpc/v1 \
  -H "Authorization: Bearer ak_test_local" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "listApiaries",
    "params": { "limit": 20 }
  }'
```

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "data": [], "next_cursor": null } }
```

## 2. Create an apiary

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "createApiary",
  "params": {
    "name": "Orchard apiary",
    "location": { "latitude": 55.7558, "longitude": 37.6173 },
    "idempotency_key": "5f2c7a4e-2f1e-4c1a-9d1e-0c1d2e3f4a5b"
  }
}
```

`result` is the Apiary object, including `id`.

## 3. Read it back

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "getApiary",
  "params": { "apiary_id": "ap_01J8Z5N6K8Q2X3W4V5B6C7D8E9" }
}
```

## Next steps

- [Method reference](/rpc/reference/) · [OpenRPC document](/specs/rpc/v1.json)
- [Architecture & concepts](/)
