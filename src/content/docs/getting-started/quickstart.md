---
title: Quickstart
description: Get an API key and make your first successful request in five minutes.
sidebar:
  order: 1
---

By the end of this page you will have created an apiary in the sandbox and read it back.

## 1. Get a sandbox API key

Sign in to the APIculture dashboard, open **Developers → API keys** and create a key in the **Sandbox** environment. Sandbox keys start with `ak_test_` and cannot touch production data.

:::caution
Treat API keys like passwords. Never ship them in mobile or browser code; call the API from your backend.
:::

## 2. Make your first request

```bash
curl https://sandbox.api.apiculture.example/v1/apiaries \
  -H "Authorization: Bearer ak_test_REPLACE_ME"
```

A fresh sandbox account has no apiaries yet, so you get an empty page:

```json
{
  "data": [],
  "next_cursor": null
}
```

A `200` response means authentication works. If you get `401`, check the [Authentication](/getting-started/authentication/) page.

## 3. Create an apiary

```bash
curl -X POST https://sandbox.api.apiculture.example/v1/apiaries \
  -H "Authorization: Bearer ak_test_REPLACE_ME" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 5f2c7a4e-2f1e-4c1a-9d1e-0c1d2e3f4a5b" \
  -d '{
    "name": "Orchard apiary",
    "location": { "latitude": 55.7558, "longitude": 37.6173 }
  }'
```

```json
{
  "id": "ap_01J8Z5N6K8Q2X3W4V5B6C7D8E9",
  "name": "Orchard apiary",
  "location": { "latitude": 55.7558, "longitude": 37.6173 },
  "hive_count": 0,
  "created_at": "2026-09-30T16:00:00Z"
}
```

The `Idempotency-Key` header makes the request safe to retry: sending the same request again returns this same apiary instead of creating a duplicate. See [Idempotency](/guides/idempotency/).

## 4. Read it back

```bash
curl https://sandbox.api.apiculture.example/v1/apiaries/ap_01J8Z5N6K8Q2X3W4V5B6C7D8E9 \
  -H "Authorization: Bearer ak_test_REPLACE_ME"
```

## Next steps

- Add hives and record inspections — see the [API Reference](/reference/v1/).
- Page through long lists with [Pagination](/guides/pagination/).
- Get notified about changes with [Webhooks](/guides/webhooks/).
- Understand how the pieces fit together in the [Data model](/concepts/data-model/).
