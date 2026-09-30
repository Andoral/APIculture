---
title: Hive lifecycle
description: The statuses a hive moves through and what triggers each transition.
sidebar:
  order: 2
---

Every hive has a `status` field describing the state of the colony.

| Status | Meaning |
| --- | --- |
| `active` | A healthy colony with a laying queen. The default for new hives. |
| `queenless` | No queen was seen in recent inspections and no eggs are present. |
| `swarmed` | Most of the colony left with the old queen. |
| `dead` | The colony died. The hive box may be reused by creating a new hive. |
| `archived` | Hidden from default lists. Terminal state. |

## Transitions

```text
              ┌──────────────┐
   create ──▶ │    active    │ ◀─────────────┐
              └──────┬───────┘               │ new queen accepted
        no queen /   │   \  colony left      │
        no eggs      ▼    ▼                  │
        ┌────────────┐  ┌────────────┐       │
        │  queenless │  │  swarmed   │ ──────┘
        └─────┬──────┘  └─────┬──────┘
              │               │
              ▼               ▼
              ┌──────────────┐
              │     dead     │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │   archived   │
              └──────────────┘
```

- Status changes are made by the beekeeper in the app or via `PATCH /hives/{hiveId}`; the API never changes a status on its own based on inspection data.
- `archived` is terminal. Archived hives are excluded from `GET /hives` unless `status=archived` is passed explicitly.
- Every change emits a `hive.status_changed` [webhook event](/guides/webhooks/) with the previous and new status in `data`.
