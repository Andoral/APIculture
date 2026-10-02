---
title: GraphQL
description: GraphQL API documented from an SDL schema.
---

GraphQL exposes the same domain as a typed graph. Query what you need; mutate to write. The machine-readable contract is the **SDL**.

| | |
| --- | --- |
| **Contract** | [`specs/graphql/v1/schema.graphql`](https://github.com/Andoral/APIculture/blob/main/specs/graphql/v1/schema.graphql) · [`/specs/graphql/v1.graphql`](/specs/graphql/v1.graphql) |
| **Reference** | [Schema](/graphql/reference/) |
| **Host** | `http://127.0.0.1:8787/graphql` ([local sandbox](/getting-started/sandbox/)) · `https://sandbox.api.apiculture.example/graphql` |

[Quickstart](/graphql/quickstart/) · [Authentication](/getting-started/authentication/) · [REST equivalent](/rest/)

## Conventions

- HTTP `POST` with `Content-Type: application/json` and body `{ "query", "variables", "operationName" }`. `GET` with a `query=` parameter is accepted for trusted, cacheable reads.
- `Authorization: Bearer ak_…`.
- Field names are camelCase (`hiveCount`, `createdAt`). Enums are `SCREAMING_SNAKE_CASE`.
- Lists use Relay-style connections: `first` / `after` / `pageInfo.endCursor` / `hasNextPage`.
- There are **no GraphQL subscriptions** here. Live events go through [WebSocket](/websocket/) or REST [webhooks](/rest/guides/webhooks/).

## Errors

HTTP status is `200` for almost every GraphQL response. Look at `errors[]`.

```json
{
  "data": { "apiary": null },
  "errors": [
    {
      "message": "The resource does not exist or is not visible to this account.",
      "path": ["apiary"],
      "extensions": { "code": "not_found" }
    }
  ]
}
```

`extensions.code` uses the same strings as REST (`unauthenticated`, `not_found`, `validation_failed`, `apiary_not_empty`, `rate_limited`). A transport failure (invalid JSON, missing body) is still HTTP `400`.
