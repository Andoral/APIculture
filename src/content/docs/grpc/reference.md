---
title: Reference
description: gRPC services and RPCs from the Protocol Buffers schema.
sidebar:
  order: 2
---

Package `apiculture.v1`. Schema: [`/specs/grpc/v1.proto`](/specs/grpc/v1.proto).

## ApiaryService

| RPC | Request | Response |
| --- | --- | --- |
| `ListApiaries` | `limit`, `cursor` | `repeated Apiary data`, `next_cursor` |
| `CreateApiary` | `name`, `location`, `idempotency_key` | `Apiary` |
| `GetApiary` | `apiary_id` | `Apiary` |
| `UpdateApiary` | `apiary_id`, `name`, `location` | `Apiary` |
| `DeleteApiary` | `apiary_id` | empty |

## HiveService

| RPC | Request | Response |
| --- | --- | --- |
| `ListHives` | `apiary_id`, `status`, `limit`, `cursor` | `repeated Hive data`, `next_cursor` |
| `CreateHive` | `apiary_id`, `label`, `queen_installed_at`, `idempotency_key` | `Hive` |
| `GetHive` | `hive_id` | `Hive` |

`HiveStatus`: `ACTIVE`, `QUEENLESS`, `SWARMED`, `DEAD`, `ARCHIVED`.

## InspectionService

| RPC | Request | Response |
| --- | --- | --- |
| `ListInspections` | `hive_id`, `limit`, `cursor` | `repeated Inspection data`, `next_cursor` |
| `CreateInspection` | `hive_id`, `inspected_at`, plus optional inspection fields | `Inspection` |

## WebhookService

| RPC | Request | Response |
| --- | --- | --- |
| `ListWebhooks` | empty | `repeated WebhookEndpoint data` |
| `CreateWebhook` | `url`, `repeated events` | `WebhookEndpoint` (includes `secret`) |

`WebhookEventType`: `INSPECTION_CREATED`, `HIVE_STATUS_CHANGED`, `APIARY_DELETED`.
