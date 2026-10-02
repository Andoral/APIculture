---
title: Changelog
description: Every change to the API, dated and tagged.
tableOfContents:
  maxHeadingLevel: 2
---

Entries are tagged **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**. Anything under **Removed** or a type change under **Changed** only ever happens in a new major version; see [Versioning & deprecation](/resources/versioning/).

## 2026-10-02 — local sandbox and contract lint

**Added**

- Local in-memory sandbox (`npm run sandbox`) for REST, SOAP, JSON-RPC, GraphQL and WebSocket.
- Structural lint for WSDL, OpenRPC, proto, GraphQL SDL and AsyncAPI in `scripts/lint-specs.mjs`.
- [Local sandbox](/getting-started/sandbox/) page.

## 2026-10-01 — multi-protocol contracts

**Added**

- SOAP WSDL covering the full apiary / hive / inspection / webhook surface.
- JSON-RPC 2.0 methods in OpenRPC (`listApiaries` … `createWebhook`).
- gRPC services in `apiculture.v1` (Protocol Buffers).
- GraphQL SDL with Relay-style connections and mutations.
- WebSocket channels in AsyncAPI 3 (`hive.{id}.inspections`, `.status`, `apiary.{id}.deleted`).

## 2026-09-30 — v1.0.0

**Added**

- Initial public release of API v1.
- Resources: apiaries, hives, inspections, webhook endpoints.
- Cursor pagination on all list endpoints.
- `Idempotency-Key` support on all `POST` endpoints.
- Webhook events: `inspection.created`, `hive.status_changed`, `apiary.deleted`.
- Sandbox environment at `https://sandbox.api.apiculture.example/v1`.
