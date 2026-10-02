---
title: Terms of Service
description: Terms for using the APIculture documentation, contracts, and local sandbox.
---

These terms apply to the APIculture documentation site, the machine-readable contracts in this repository, and the local sandbox. They are the document linked from the REST OpenAPI `info.termsOfService` field.

**Last updated:** 2 October 2026.

This project is a **docs-as-code developer portal and sample API**, not a hosted commercial service. Hosts such as `api.apiculture.example` and `sandbox.api.apiculture.example` are documentation defaults. They are not operated by this repository.

## 1. Acceptance

By reading the documentation, using a contract under `specs/`, or running the local sandbox, you agree to these terms. If you do not agree, do not use the sandbox or treat the sample API as a production dependency.

## 2. What you are using

| Piece | Role |
| --- | --- |
| Documentation site | Human-readable guides and references. |
| Contracts (`specs/`) | OpenAPI, WSDL, OpenRPC, Protocol Buffers, GraphQL SDL, AsyncAPI. |
| Local sandbox (`npm run sandbox`) | An in-memory process on your machine (`127.0.0.1:8787` by default) that implements the HTTP styles for local experiments. |
| gRPC | Contract-only in this repository. The sandbox does not serve gRPC. |

There is no production tenant, billing, dashboard, or SLA provided from this repository.

## 3. Local sandbox

- Bind address defaults to loopback. Do not expose it to a public network.
- Any `ak_test_…` string is accepted. Keys are not issued, and `ak_live_…` is rejected.
- Data is stored in memory and is discarded when the process exits.
- Webhook URLs may be recorded, but the sandbox does not HTTP POST to them.
- Do not send real secrets, personal data, or production credentials to the sandbox.
- The sandbox is provided **as is** for learning and contract exploration, including Scalar **Test request**.

## 4. API keys and examples

Example keys in the docs (`ak_test_…`, `ak_live_…`) are illustrative. They do not grant access to any third-party system. You are responsible for how you store any keys you generate for your own integrations.

## 5. Acceptable use

You may use the contracts and sandbox to learn the API styles, generate clients, and test against the documented behaviour.

You may not:

- present this sandbox or the example hosts as a live production APIculture service;
- use the sandbox to attack, scan, or send unsolicited traffic to systems you do not operate;
- attempt to circumvent the loopback default in order to offer the sandbox as a public API.

## 6. Intellectual property

Unless a file says otherwise, repository content is offered under **Apache License 2.0** (see the OpenAPI `info.license` field). You must retain notices required by that license.

APIculture, the honeycomb mark, and related names are used here as project branding for this documentation portal.

## 7. No warranty

The documentation, contracts, and sandbox are provided **“as is”**, without warranties of any kind, including merchantability, fitness for a particular purpose, and non-infringement. Behaviour may change as the contracts evolve. See [Versioning & deprecation](/resources/versioning/).

## 8. Limitation of liability

To the extent permitted by law, the authors and contributors are not liable for any indirect, incidental, special, consequential, or punitive damages, or for lost data, arising from use of the documentation or sandbox.

## 9. Changes

These terms may be updated in this repository. The date at the top of the page is the effective date of the published version.

## 10. Contact

Questions and issues: [github.com/Andoral/APIculture/issues](https://github.com/Andoral/APIculture/issues).
