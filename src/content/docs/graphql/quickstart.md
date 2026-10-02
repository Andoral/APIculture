---
title: Quickstart
description: Query and create an apiary with GraphQL.
sidebar:
  order: 1
---

You need a sandbox key (`ak_test_…`) — see [Authentication](/getting-started/authentication/).

## 1. List apiaries

```bash
curl http://127.0.0.1:8787/graphql \
  -H "Authorization: Bearer ak_test_local" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ apiaries { edges { node { id name hiveCount } } pageInfo { hasNextPage } } }"}'
```

```json
{
  "data": {
    "apiaries": {
      "edges": [],
      "pageInfo": { "hasNextPage": false, "endCursor": null }
    }
  }
}
```

## 2. Create an apiary

```graphql
mutation Create($input: ApiaryInput!) {
  createApiary(input: $input) {
    id
    name
    hiveCount
    createdAt
  }
}
```

```json
{
  "query": "mutation Create($input: ApiaryInput!) { createApiary(input: $input) { id name hiveCount createdAt } }",
  "variables": {
    "input": {
      "name": "Orchard apiary",
      "location": { "latitude": 55.7558, "longitude": 37.6173 }
    }
  }
}
```

## 3. Read it back

```graphql
query One($id: ID!) {
  apiary(id: $id) { id name location { latitude longitude } hiveCount }
}
```

## Next steps

- [Schema reference](/graphql/reference/) · [SDL](/specs/graphql/v1.graphql)
- [Architecture & concepts](/)
