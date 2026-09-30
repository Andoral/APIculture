---
title: Pagination
description: Page through list endpoints with cursors.
sidebar:
  order: 1
---

All list endpoints (`GET /apiaries`, `GET /hives`, `GET /hives/{hiveId}/inspections`) return pages of at most 100 items and use **cursor pagination**.

## Response shape

```json
{
  "data": [ /* up to `limit` items */ ],
  "next_cursor": "eyJpZCI6ImFwXzAxSjhaNU42SzhRMlgzVzRWNUI2QzdEOEU5In0"
}
```

`next_cursor` is `null` on the last page.

## Requesting pages

| Query parameter | Default | Description |
| --- | --- | --- |
| `limit` | `20` | Items per page, `1`–`100`. |
| `cursor` | – | The `next_cursor` value from the previous response. |

```bash
# first page
curl "https://api.apiculture.example/v1/hives?limit=50" -H "Authorization: Bearer $KEY"

# next page
curl "https://api.apiculture.example/v1/hives?limit=50&cursor=eyJpZCI6..." -H "Authorization: Bearer $KEY"
```

## Rules

- Cursors are opaque. Do not parse or construct them; they may change format at any time without notice.
- Keep filters (`apiary_id`, `status`, …) identical across pages. Changing a filter mid-way returns `400 invalid_cursor`.
- Cursors expire after 24 hours.
- Items are ordered by creation time, newest first. Items created while you page will not appear until you start over.

## Full iteration

```python
def iterate(session, url, **params):
    cursor = None
    while True:
        page = session.get(url, params={**params, "cursor": cursor, "limit": 100}).json()
        yield from page["data"]
        cursor = page["next_cursor"]
        if cursor is None:
            return
```
