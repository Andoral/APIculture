---
title: Reference
description: GraphQL types, queries and mutations from the SDL.
sidebar:
  order: 2
---

Full schema: [`/specs/graphql/v1.graphql`](/specs/graphql/v1.graphql). Point GraphiQL, Apollo Studio or your IDE at that file (or at the `/graphql` HTTP endpoint, which also serves introspection).

## Queries

| Field | Args | Returns |
| --- | --- | --- |
| `apiaries` | `first`, `after` | `ApiaryConnection!` |
| `apiary` | `id` | `Apiary` |
| `hives` | `apiaryId`, `status`, `first`, `after` | `HiveConnection!` |
| `hive` | `id` | `Hive` |
| `inspections` | `hiveId`, `first`, `after` | `InspectionConnection!` |
| `webhookEndpoints` | — | `[WebhookEndpoint!]!` |

Nested shortcuts: `Apiary.hives`, `Hive.inspections`, `Hive.apiary`.

## Mutations

| Field | Args | Returns |
| --- | --- | --- |
| `createApiary` | `input: ApiaryInput!` | `Apiary!` |
| `updateApiary` | `id`, `input` | `Apiary!` |
| `deleteApiary` | `id` | `Boolean!` |
| `createHive` | `input: HiveInput!` | `Hive!` |
| `createInspection` | `hiveId`, `input: InspectionInput!` | `Inspection!` |
| `createWebhookEndpoint` | `input: WebhookEndpointInput!` | `WebhookEndpointCreated!` (`secret` once) |

## Enums

- `HiveStatus`: `ACTIVE`, `QUEENLESS`, `SWARMED`, `DEAD`, `ARCHIVED`
- `Temperament`: `CALM`, `NERVOUS`, `AGGRESSIVE`
- `WebhookEventType`: `INSPECTION_CREATED`, `HIVE_STATUS_CHANGED`, `APIARY_DELETED`

## Pagination

```graphql
query Page($after: String) {
  apiaries(first: 50, after: $after) {
    edges { cursor node { id name } }
    pageInfo { endCursor hasNextPage }
  }
}
```

Pass the previous `endCursor` as `after` until `hasNextPage` is false.
