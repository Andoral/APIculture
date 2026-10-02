---
title: SOAP
description: XML document/literal API documented from a WSDL.
---

SOAP exposes the same apiary / hive / inspection domain as REST, as a **document/literal** service. The machine-readable contract is the WSDL — import it into SoapUI, a generated stub, or any WSDL-aware client.

| | |
| --- | --- |
| **Contract** | [`specs/soap/v1/apiculture.wsdl`](https://github.com/Andoral/APIculture/blob/main/specs/soap/v1/apiculture.wsdl) · [`/specs/soap/v1.wsdl`](/specs/soap/v1.wsdl) |
| **Reference** | [Operations](/soap/reference/) |
| **Host** | `http://127.0.0.1:8787/soap/v1` ([local sandbox](/getting-started/sandbox/)) · `https://sandbox.api.apiculture.example/soap/v1` |

[Quickstart](/soap/quickstart/) · [Authentication](/getting-started/authentication/) · [REST equivalent](/rest/)

## Conventions

- Style: document / literal, SOAP 1.1 over HTTPS.
- `soapAction` is `https://api.apiculture.example/soap/v1/{Operation}`.
- Identifiers, timestamps and the data model match [Architecture & concepts](/). XML names are camelCase (`hiveCount`, `createdAt`).
- Pass `Authorization: Bearer ak_…` on the HTTP request. Do not put the key in the envelope.

## Faults

SOAP Fault `detail` carries a `code` from the same catalogue as REST, plus a `detail` string.

| REST status | SOAP `code` |
| --- | --- |
| 400 | `malformed_request` |
| 401 | `unauthenticated` |
| 404 | `not_found` |
| 409 | `apiary_not_empty` |
| 422 | `validation_failed` / `idempotency_key_reused` |
| 429 | `rate_limited` |
