---
title: Reference
description: JSON-RPC methods from the OpenRPC document.
sidebar:
  order: 2
---

Machine-readable list: [`/specs/rpc/v1.json`](/specs/rpc/v1.json). Import it into an OpenRPC inspector to generate clients.

Every call is:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "<name>", "params": { } }
```

## Apiaries

| Method | Params | Result |
| --- | --- | --- |
| `listApiaries` | `limit?`, `cursor?` | `{ data, next_cursor }` |
| `createApiary` | `name`, `location?`, `idempotency_key?` | `Apiary` |
| `getApiary` | `apiary_id` | `Apiary` |
| `updateApiary` | `apiary_id`, `name?`, `location?` | `Apiary` |
| `deleteApiary` | `apiary_id` | `true` |

## Hives

| Method | Params | Result |
| --- | --- | --- |
| `listHives` | `apiary_id?`, `status?`, `limit?`, `cursor?` | `{ data, next_cursor }` |
| `createHive` | `apiary_id`, `label`, `queen_installed_at?`, `idempotency_key?` | `Hive` |
| `getHive` | `hive_id` | `Hive` |

## Inspections

| Method | Params | Result |
| --- | --- | --- |
| `listInspections` | `hive_id`, `limit?`, `cursor?` | `{ data, next_cursor }` |
| `createInspection` | `hive_id`, `inspected_at`, plus optional inspection fields | `Inspection` |

## Webhooks

| Method | Params | Result |
| --- | --- | --- |
| `listWebhooks` | — | `WebhookEndpoint[]` |
| `createWebhook` | `url`, `events` | endpoint **with** `secret` |

Field names are snake_case, identical to REST JSON.
