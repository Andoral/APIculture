---
title: Reference
description: SOAP operations generated from the WSDL.
sidebar:
  order: 2
---

Import [`/specs/soap/v1.wsdl`](/specs/soap/v1.wsdl) into a SOAP client. All operations live on one port, `APIculturePort`. Namespace: `https://api.apiculture.example/soap/v1`.

## Apiaries

| Operation | SOAPAction suffix | Notes |
| --- | --- | --- |
| `ListApiaries` | `ListApiaries` | Optional `limit`, `cursor`. |
| `CreateApiary` | `CreateApiary` | Required `name`. Optional `idempotencyKey`. |
| `GetApiary` | `GetApiary` | `apiaryId`. |
| `UpdateApiary` | `UpdateApiary` | Only supplied fields change. |
| `DeleteApiary` | `DeleteApiary` | Fault `apiary_not_empty` if hives remain. |

```xml
<CreateApiary xmlns="https://api.apiculture.example/soap/v1">
  <name>Orchard apiary</name>
  <location><latitude>55.7558</latitude><longitude>37.6173</longitude></location>
</CreateApiary>
```

## Hives

| Operation | Notes |
| --- | --- |
| `ListHives` | Optional `apiaryId`, `status`, `limit`, `cursor`. |
| `CreateHive` | Required `apiaryId`, `label`. |
| `GetHive` | `hiveId`. |

`status` values: `active`, `queenless`, `swarmed`, `dead`, `archived`.

## Inspections

| Operation | Notes |
| --- | --- |
| `ListInspections` | Required `hiveId`. |
| `CreateInspection` | Required `hiveId`, `inspectedAt`. Optional `queenSeen`, `broodFrames`, `temperament`, `notes`. |

Inspections are append-only.

## Webhooks

| Operation | Notes |
| --- | --- |
| `ListWebhooks` | Empty body. |
| `CreateWebhook` | `url` plus one or more `events`. `secret` is in the response once. |

Event names match REST: `inspection.created`, `hive.status_changed`, `apiary.deleted`.
