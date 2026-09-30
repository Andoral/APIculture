---
title: Changelog
description: Every change to the API, dated and tagged.
tableOfContents:
  maxHeadingLevel: 2
---

Entries are tagged **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**. Anything under **Removed** or a type change under **Changed** only ever happens in a new major version; see [Versioning & deprecation](/resources/versioning/).

## 2026-09-30 — v1.0.0

**Added**

- Initial public release of API v1.
- Resources: apiaries, hives, inspections, webhook endpoints.
- Cursor pagination on all list endpoints.
- `Idempotency-Key` support on all `POST` endpoints.
- Webhook events: `inspection.created`, `hive.status_changed`, `apiary.deleted`.
- Sandbox environment at `https://sandbox.api.apiculture.example/v1`.
