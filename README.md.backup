# APIculture — Документация API

Данный проект отображает видение автора как должна выглядеть необходимая и достаточная документация по API для разработчиков, аналитиков и других заинтересованных лиц по работе с проектом.

Документация создана по методу docs-as-code, одна предметная область описана несколькими стилями API.

Документация представлена в виде нескольких разделов:
1. Вступление -- основная информация по проекту, а именно, архитектура, основные URL, API стили, структура данных и Статусы
2. Описание API стиля -- начальная информация для работы с API и методы
3. Ресурсы -- общие материалы про весь портал, такие как спецификации, форматы ошибок, версионирование, условия использования и изменения API

Важно: автор считает, что описанная в документации архитектура не претендует на эталон. Это учебный пример того, как документировать одну систему сразу в нескольких стилях API.

Как устроено:
1. Контракты в specs/ — OpenAPI 3.1, WSDL, OpenRPC, Protobuf, GraphQL SDL, AsyncAPI.
2. Документация — Markdown/MDX в src/content/docs/
3. Песочница sandbox/ — Node + Hono на 127.0.0.1:8787: REST, SOAP, JSON-RPC, GraphQL, WebSocket, store в памяти на ключ. (исключение -- gRPC)

## Технический стек

| Назначение | Инструмент | Зачем |
| --- | --- | --- |
| Сайт документации | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) | Статическая сборка, без JS по умолчанию; сразу есть сайдбар, поиск, i18n и тёмная тема. |
| REST-справочник | [Scalar](https://github.com/scalar/scalar) | Три колонки, примеры кода, встроенный клиент Test request. |
| Проверка контрактов | [Spectral](https://github.com/stoplightio/spectral) + `scripts/lint-specs.mjs` | OpenAPI линтится Spectral. WSDL, OpenRPC, proto, GraphQL SDL и AsyncAPI разбираются и проверяются структурно в CI. |
| Поиск | Pagefind (входит в Starlight) | Статический индекс, без внешнего сервиса. |
| Хостинг | GitHub Pages (продакшен), Cloudflare Pages (превью PR) | Статика, бесплатно, за CDN. См. `.github/workflows/docs.yml`. |
| Песочница | `npm run sandbox` | Сервер в памяти для REST, SOAP, JSON-RPC, GraphQL и WebSocket. gRPC остаётся только контрактом (нужны HTTP/2 и сгенерированные stubs). |

## Архитектура

```
specs/
  rest/v1/openapi.yaml           # OpenAPI 3.1
  soap/v1/apiculture.wsdl        # WSDL (document/literal)
  rpc/v1/openrpc.json            # OpenRPC 1.3
  grpc/v1/apiculture.proto       # Protocol Buffers 3
  graphql/v1/schema.graphql      # GraphQL SDL
  websocket/v1/asyncapi.yaml     # AsyncAPI 3
.spectral.yaml                   # OpenAPI lint rules
scripts/lint-specs.mjs           # all-style contract checks
sandbox/                         # local multi-style sandbox
src/
  content/docs/
    index.mdx                    # architecture, data model, map of styles
    getting-started/
    rest/                        # REST overview, quickstart, guides
    soap/ rpc/ grpc/ graphql/ websocket/
    reference/index.md           # contract catalog
    resources/ changelog.md
  pages/
    reference/rest/v1.astro      # Scalar
    reference/websocket/v1.astro
    specs/**                     # serves files from specs/
  lib/serve-spec.ts
astro.config.mjs                 # sidebar + redirects from old REST URLs
.github/workflows/docs.yml
```

## Локальная песочница

```bash
npm install
npm run dev          # http://localhost:4321
npm run sandbox      # http://127.0.0.1:8787  (REST / SOAP / JSON-RPC / GraphQL / WS)
npm run lint:specs   # Spectral + structural checks for every style
npm run build        # lint + static build into dist/
npm run preview      # serve dist/
```

С локальной песочницей работает любой ключ формата `Authorization: Bearer ak_test_…`. Для каждого ключа создается отдельное изолированное хранилище в оперативной памяти. Ключи формата `ak_live_…` (предназначенные для продакшена) отклоняются.

В [справочнике по REST API](http://localhost:4321/reference/rest/v1/) выберите сервер **Local sandbox**, а затем воспользуйтесь функцией **Test request**.

### Тестовый запрос и CORS

Локальная песочница (sandbox) отправляет заголовок `Access-Control-Allow-Origin:`, поэтому Scalar взаимодействует с ней напрямую (без прокси). API, развернутый в рабочей среде, должен аналогичным образом разрешать доступ с домена, на котором размещена документация. Указанные в контрактах вымышленные хосты вида `.apiculture.example` — это лишь значения по умолчанию для документации, а не реально работающие сервисы.
