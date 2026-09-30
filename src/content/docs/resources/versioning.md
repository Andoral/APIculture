---
title: Versioning & deprecation
description: How the API evolves, what counts as a breaking change, and how much notice you get.
---

The major version is part of the URL: `https://api.apiculture.example/v1/…`. A new major version is a new base path; existing versions keep working unchanged.

## What we may change without a new version

These changes are **non-breaking**. Clients must tolerate them:

- Adding a new endpoint, a new optional request field, or a new query parameter.
- Adding a new field to a response object.
- Adding a new value to an enum that is **documented as open** (`code`, webhook `type`).
- Adding a new webhook event type (you only receive the types you subscribe to).
- Changing the wording of `title` and `detail` in error responses.
- Changing the format or length of identifiers and cursors (they are opaque).

Practical consequence: deserialise responses leniently — ignore unknown fields and unknown enum values instead of failing.

## What requires a new major version

- Removing or renaming an endpoint or a field.
- Changing a field's type or making an optional field required.
- Changing the meaning of an existing value.
- Removing a value from a closed enum (`status`, `temperament`).

## Deprecation process

1. The change is announced in the [Changelog](/changelog/) and in the reference with a **Deprecated** badge, together with the migration path.
2. Responses from a deprecated endpoint carry `Deprecation: true` and `Sunset: <HTTP date>` headers.
3. The deprecated behaviour keeps working for **at least 12 months** after the announcement.
4. On the sunset date the endpoint starts returning `410 Gone` with `code: endpoint_sunset`.

## Support window

Each major version is supported for at least 24 months after the next one becomes stable. Security fixes are applied to every supported version.
