---
title: Data model
description: The resources the API exposes and how they relate to each other.
sidebar:
  order: 1
---

The API is organised around three resources owned by an **account** (the beekeeper or organisation that owns the API key).

```text
Account
├── Apiary (1..n)
│   └── Hive (0..n)
│       └── Inspection (0..n, append-only)
└── Webhook endpoint (0..n)
```

| Resource | Identifier prefix | Description |
| --- | --- | --- |
| Apiary | `ap_` | A physical site with a name and optional coordinates. |
| Hive | `hv_` | One colony in one hive box. Belongs to exactly one apiary and carries a [lifecycle status](/concepts/hive-lifecycle/). |
| Inspection | `in_` | An immutable record of a visit to a hive: queen seen, brood frames, temperament, notes. |
| Webhook endpoint | `wh_` | An HTTPS URL that receives [events](/guides/webhooks/). |

## Identifiers

Identifiers are strings composed of a resource prefix and a 26-character [ULID](https://github.com/ulid/spec), e.g. `hv_01J8Z5P2M3N4B5V6C7X8Z9A0S1`. They are unique across all accounts, sort chronologically, and are safe to use as URL path segments. Do not rely on their length or format beyond the prefix.

## Mutability

- Apiaries and hives can be updated with `PATCH`.
- Inspections are **append-only**. A mistaken inspection is corrected by recording a new one; the history is never rewritten.
- Deleting an apiary is refused (`409`) while it still contains hives — move or delete them first.

## Timestamps and dates

- `*_at` fields are RFC 3339 timestamps in UTC with a `Z` suffix.
- Date-only fields such as `queen_installed_at` use `YYYY-MM-DD` and have no time zone.
- `created_at` is set by the server; `inspected_at` is supplied by you and may be in the past.
