---
title: Reference
description: WebSocket channels and payloads from the AsyncAPI document.
sidebar:
  order: 2
---

Interactive rendering of the same file: [AsyncAPI explorer](/reference/websocket/v1/). Download: [`/specs/websocket/v1.yaml`](/specs/websocket/v1.yaml).

## Client → server (`control`)

| `op` | Fields | When |
| --- | --- | --- |
| `auth` | `token` | First frame, if the URL has no `?token=`. |
| `subscribe` | `channel` | After auth. Repeat per channel. |
| `unsubscribe` | `channel` | Stop a previous subscribe. |
| `ping` | — | At least every 30 seconds. |

## Server → client

| Channel | `type` | `data` |
| --- | --- | --- |
| `hive.{hiveId}.inspections` | `inspection.created` | Inspection object (REST shape). |
| `hive.{hiveId}.status` | `hive.status_changed` | Hive object after the transition, plus `previous_status`. |
| `apiary.{apiaryId}.deleted` | `apiary.deleted` | `{ "id": "ap_…" }` |

Envelope:

```json
{
  "id": "evt_…",
  "type": "inspection.created",
  "created_at": "2026-09-28T09:30:05Z",
  "data": {}
}
```

Subscribe to a concrete id, not a glob. For “everything in my account”, register a REST [webhook](/rest/guides/webhooks/).
