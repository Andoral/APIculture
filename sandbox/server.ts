import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { buildSchema, graphql } from 'graphql';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { XMLParser } from 'fast-xml-parser';
import { WebSocketServer, type WebSocket } from 'ws';
import {
	ApiError,
	authenticate,
	consumeRate,
	createApiary,
	createHive,
	createInspection,
	createWebhook,
	deleteApiary,
	getApiary,
	getHive,
	listApiaries,
	listHives,
	listInspections,
	listWebhooks,
	subscribe,
	unsubscribe,
	updateApiary,
	type Account,
	type DomainEvent,
	type Hive,
	type Inspection,
	type Page,
	type WebhookEventType,
} from './store.ts';

const PORT = Number(process.env.SANDBOX_PORT || 8787);
const HOST = process.env.SANDBOX_HOST || '127.0.0.1';
const graphqlSchema = buildSchema(readFileSync(resolve(import.meta.dirname, '../specs/graphql/v1/schema.graphql'), 'utf8'));
const xmlParser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, isArray: (name) => name === 'events' });

const RPC_PARAMS: Record<string, string[]> = {
	listApiaries: ['limit', 'cursor'],
	createApiary: ['name', 'location', 'idempotency_key'],
	getApiary: ['apiary_id'],
	updateApiary: ['apiary_id', 'name', 'location'],
	deleteApiary: ['apiary_id'],
	listHives: ['apiary_id', 'status', 'limit', 'cursor'],
	createHive: ['apiary_id', 'label', 'queen_installed_at', 'idempotency_key'],
	getHive: ['hive_id'],
	listInspections: ['hive_id', 'limit', 'cursor'],
	createInspection: [
		'hive_id',
		'inspected_at',
		'queen_seen',
		'brood_frames',
		'temperament',
		'notes',
		'idempotency_key',
	],
	listWebhooks: [],
	createWebhook: ['url', 'events'],
};

function problem(err: ApiError, instance: string) {
	return {
		type: `https://docs.apiculture.example/resources/errors#${err.code}`,
		title: err.title,
		status: err.status,
		detail: err.detail,
		instance,
		code: err.code,
		...(err.errors ? { errors: err.errors } : {}),
	};
}

function jsonError(c: { req: { path: string }; json: (body: unknown, status?: number, headers?: Record<string, string>) => Response }, err: unknown, remaining?: number) {
	const apiErr =
		err instanceof ApiError
			? err
			: new ApiError(400, 'malformed_request', 'Malformed request', 'The request is malformed (invalid JSON, wrong types).');
	const headers: Record<string, string> = { 'Content-Type': 'application/problem+json' };
	if (remaining != null) headers['X-RateLimit-Remaining'] = String(remaining);
	if (apiErr.status === 429) headers['Retry-After'] = '60';
	return c.json(problem(apiErr, c.req.path), apiErr.status as 400, headers);
}

function requireAuth(header: string | undefined): { key: string; account: Account; remaining: number } {
	const { key, account } = authenticate(header);
	const remaining = consumeRate(account);
	return { key, account, remaining };
}

function withRate<T>(remaining: number, body: T): { body: T; headers: Record<string, string> } {
	return { body, headers: { 'X-RateLimit-Remaining': String(remaining) } };
}

function rpcParams(method: string, params: unknown): Record<string, unknown> {
	if (params == null) return {};
	if (Array.isArray(params)) {
		const names = RPC_PARAMS[method] ?? [];
		return Object.fromEntries(names.map((name, i) => [name, params[i]]));
	}
	if (typeof params === 'object') return params as Record<string, unknown>;
	throw new ApiError(400, 'malformed_request', 'Malformed request', '`params` must be an object or an array.');
}

function graphqlHiveStatus(status: Hive['status']): string {
	return status.toUpperCase();
}

function restHiveStatus(status: string | undefined): string | undefined {
	if (!status) return undefined;
	return status.toLowerCase();
}

function graphqlEvent(event: string): WebhookEventType {
	return event.toLowerCase().replaceAll('_', '.') as WebhookEventType;
}

function connection<T extends { id: string }>(page: Page<T>) {
	return {
		edges: page.data.map((node) => ({ cursor: node.id, node })),
		pageInfo: { endCursor: page.next_cursor, hasNextPage: page.next_cursor != null },
	};
}

function graphqlRoot(account: Account, key: string) {
	return {
		apiaries: ({ first, after }: { first?: number; after?: string }) =>
			connection(listApiaries(account, first ?? 20, after)),
		apiary: ({ id }: { id: string }) => getApiary(account, id),
		hives: ({ apiaryId, status, first, after }: { apiaryId?: string; status?: string; first?: number; after?: string }) =>
			connection(listHives(account, { apiary_id: apiaryId, status: restHiveStatus(status), limit: first, cursor: after })),
		hive: ({ id }: { id: string }) => getHive(account, id),
		inspections: ({ hiveId, first, after }: { hiveId: string; first?: number; after?: string }) =>
			connection(listInspections(account, hiveId, first ?? 20, after)),
		webhookEndpoints: () => listWebhooks(account),
		createApiary: ({ input }: { input: { name: string; location?: { latitude: number; longitude: number } } }) =>
			createApiary(account, input).value,
		updateApiary: ({ id, input }: { id: string; input: { name?: string; location?: { latitude: number; longitude: number } } }) =>
			updateApiary(account, id, input),
		deleteApiary: ({ id }: { id: string }) => {
			deleteApiary(account, key, id);
			return true;
		},
		createHive: ({ input }: { input: { apiaryId: string; label: string; queenInstalledAt?: string } }) =>
			createHive(account, {
				apiary_id: input.apiaryId,
				label: input.label,
				queen_installed_at: input.queenInstalledAt,
			}).value,
		createInspection: ({
			hiveId,
			input,
		}: {
			hiveId: string;
			input: { inspectedAt: string; queenSeen?: boolean; broodFrames?: number; temperament?: string; notes?: string };
		}) =>
			createInspection(account, key, hiveId, {
				inspected_at: input.inspectedAt,
				queen_seen: input.queenSeen,
				brood_frames: input.broodFrames,
				temperament: input.temperament?.toLowerCase(),
				notes: input.notes,
			}).value,
		createWebhookEndpoint: ({ input }: { input: { url: string; events: string[] } }) => {
			const created = createWebhook(account, {
				url: input.url,
				events: input.events.map(graphqlEvent),
			}).value;
			const { secret, ...endpoint } = created as typeof created & { secret: string };
			return { endpoint, secret };
		},
	};
}

function wrapGraphqlNode() {
	return {
		Apiary: {
			hiveCount: (apiary: { hive_count: number }) => apiary.hive_count,
			createdAt: (apiary: { created_at: string }) => apiary.created_at,
			hives: (
				apiary: { id: string },
				args: { status?: string; first?: number; after?: string },
				ctx: { account: Account },
			) =>
				connection(
					listHives(ctx.account, {
						apiary_id: apiary.id,
						status: restHiveStatus(args.status),
						limit: args.first,
						cursor: args.after,
					}),
				),
		},
		Hive: {
			apiary: (hive: Hive, _args: unknown, ctx: { account: Account }) => getApiary(ctx.account, hive.apiary_id),
			status: (hive: Hive) => graphqlHiveStatus(hive.status),
			queenInstalledAt: (hive: Hive) => hive.queen_installed_at ?? null,
			lastInspectedAt: (hive: Hive) => hive.last_inspected_at,
			createdAt: (hive: Hive) => hive.created_at,
			updatedAt: (hive: Hive) => hive.updated_at,
			inspections: (hive: Hive, args: { first?: number; after?: string }, ctx: { account: Account }) =>
				connection(listInspections(ctx.account, hive.id, args.first ?? 20, args.after)),
		},
		Inspection: {
			hive: (inspection: Inspection, _args: unknown, ctx: { account: Account }) => getHive(ctx.account, inspection.hive_id),
			inspectedAt: (inspection: Inspection) => inspection.inspected_at,
			queenSeen: (inspection: Inspection) => inspection.queen_seen,
			broodFrames: (inspection: Inspection) => inspection.brood_frames ?? null,
			temperament: (inspection: Inspection) => inspection.temperament?.toUpperCase() ?? null,
			createdAt: (inspection: Inspection) => inspection.created_at,
		},
		WebhookEndpoint: {
			createdAt: (endpoint: { created_at: string }) => endpoint.created_at,
			events: (endpoint: { events: string[] }) => endpoint.events.map((event) => event.toUpperCase().replaceAll('.', '_')),
		},
	};
}

function dispatchRpc(account: Account, key: string, method: string, rawParams: unknown) {
	const params = rpcParams(method, rawParams);
	switch (method) {
		case 'listApiaries':
			return listApiaries(account, Number(params.limit ?? 20), params.cursor as string | undefined);
		case 'createApiary':
			return createApiary(account, params, params.idempotency_key as string | undefined).value;
		case 'getApiary':
			return getApiary(account, String(params.apiary_id));
		case 'updateApiary':
			return updateApiary(account, String(params.apiary_id), params);
		case 'deleteApiary':
			deleteApiary(account, key, String(params.apiary_id));
			return true;
		case 'listHives':
			return listHives(account, {
				apiary_id: params.apiary_id as string | undefined,
				status: params.status as string | undefined,
				limit: params.limit != null ? Number(params.limit) : 20,
				cursor: params.cursor as string | undefined,
			});
		case 'createHive':
			return createHive(account, params, params.idempotency_key as string | undefined).value;
		case 'getHive':
			return getHive(account, String(params.hive_id));
		case 'listInspections':
			return listInspections(account, String(params.hive_id), Number(params.limit ?? 20), params.cursor as string | undefined);
		case 'createInspection':
			return createInspection(
				account,
				key,
				String(params.hive_id),
				params,
				params.idempotency_key as string | undefined,
			).value;
		case 'listWebhooks':
			return listWebhooks(account);
		case 'createWebhook':
			return createWebhook(account, params).value;
		default:
			throw new ApiError(400, 'malformed_request', 'Method not found', `Unknown method ${method}.`);
	}
}

function text(el: unknown): string | undefined {
	if (el == null) return undefined;
	if (typeof el === 'object' && el !== null && '#text' in el) return String((el as { '#text': unknown })['#text']);
	return String(el);
}

function num(el: unknown): number | undefined {
	const value = text(el);
	if (value == null || value === '') return undefined;
	return Number(value);
}

function xmlEscape(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function soapApiary(apiary: ReturnType<typeof getApiary>): string {
	const location = apiary.location
		? `<tns:location><tns:latitude>${apiary.location.latitude}</tns:latitude><tns:longitude>${apiary.location.longitude}</tns:longitude></tns:location>`
		: '';
	return `<tns:apiary><tns:id>${xmlEscape(apiary.id)}</tns:id><tns:name>${xmlEscape(apiary.name)}</tns:name>${location}<tns:hiveCount>${apiary.hive_count}</tns:hiveCount><tns:createdAt>${apiary.created_at}</tns:createdAt></tns:apiary>`;
}

function soapHive(hive: Hive): string {
	const queen = hive.queen_installed_at ? `<tns:queenInstalledAt>${xmlEscape(hive.queen_installed_at)}</tns:queenInstalledAt>` : '';
	const inspected = hive.last_inspected_at ? `<tns:lastInspectedAt>${xmlEscape(hive.last_inspected_at)}</tns:lastInspectedAt>` : '';
	return `<tns:hive><tns:id>${xmlEscape(hive.id)}</tns:id><tns:apiaryId>${xmlEscape(hive.apiary_id)}</tns:apiaryId><tns:label>${xmlEscape(hive.label)}</tns:label><tns:status>${hive.status}</tns:status>${queen}${inspected}<tns:createdAt>${hive.created_at}</tns:createdAt><tns:updatedAt>${hive.updated_at}</tns:updatedAt></tns:hive>`;
}

function soapInspection(inspection: Inspection): string {
	const brood = inspection.brood_frames != null ? `<tns:broodFrames>${inspection.brood_frames}</tns:broodFrames>` : '';
	const temperament = inspection.temperament ? `<tns:temperament>${inspection.temperament}</tns:temperament>` : '';
	const notes = inspection.notes ? `<tns:notes>${xmlEscape(inspection.notes)}</tns:notes>` : '';
	return `<tns:inspection><tns:id>${xmlEscape(inspection.id)}</tns:id><tns:hiveId>${xmlEscape(inspection.hive_id)}</tns:hiveId><tns:inspectedAt>${inspection.inspected_at}</tns:inspectedAt><tns:queenSeen>${inspection.queen_seen}</tns:queenSeen>${brood}${temperament}${notes}<tns:createdAt>${inspection.created_at}</tns:createdAt></tns:inspection>`;
}

function soapEnvelope(inner: string): string {
	return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="https://api.apiculture.example/soap/v1"><soap:Body>${inner}</soap:Body></soap:Envelope>`;
}

function soapFault(err: ApiError): string {
	return soapEnvelope(
		`<soap:Fault><faultcode>soap:Client</faultcode><faultstring>${xmlEscape(err.title)}</faultstring><detail><tns:Fault><tns:code>${xmlEscape(err.code)}</tns:code><tns:detail>${xmlEscape(err.detail)}</tns:detail></tns:Fault></detail></soap:Fault>`,
	);
}

function soapLocation(el: unknown): { latitude: number; longitude: number } | undefined {
	if (el == null || typeof el !== 'object') return undefined;
	const loc = el as Record<string, unknown>;
	const latitude = num(loc.latitude);
	const longitude = num(loc.longitude);
	if (latitude == null && longitude == null) return undefined;
	return { latitude: latitude as number, longitude: longitude as number };
}

function soapBody(doc: Record<string, unknown>): { name: string; payload: Record<string, unknown> } {
	const envelope = (doc.Envelope ?? doc) as Record<string, unknown>;
	const body = (envelope.Body ?? {}) as Record<string, unknown>;
	const name = Object.keys(body).find((key) => key !== 'Fault') ?? '';
	const payload = (body[name] ?? {}) as Record<string, unknown>;
	return { name, payload };
}

function handleSoap(account: Account, key: string, xml: string): string {
	const { name, payload } = soapBody(xmlParser.parse(xml) as Record<string, unknown>);
	switch (name) {
		case 'ListApiaries': {
			const page = listApiaries(account, num(payload.limit) ?? 20, text(payload.cursor));
			return soapEnvelope(
				`<tns:ListApiariesResponse>${page.data.map(soapApiary).join('')}<tns:nextCursor${page.next_cursor ? `>${xmlEscape(page.next_cursor)}` : ' xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'}></tns:nextCursor></tns:ListApiariesResponse>`,
			);
		}
		case 'CreateApiary':
			return soapEnvelope(
				`<tns:CreateApiaryResponse>${soapApiary(
					createApiary(
						account,
						{
							name: text(payload.name),
							location: soapLocation(payload.location),
						},
						text(payload.idempotencyKey),
					).value,
				)}</tns:CreateApiaryResponse>`,
			);
		case 'GetApiary':
			return soapEnvelope(`<tns:GetApiaryResponse>${soapApiary(getApiary(account, text(payload.apiaryId) ?? ''))}</tns:GetApiaryResponse>`);
		case 'UpdateApiary':
			return soapEnvelope(
				`<tns:UpdateApiaryResponse>${soapApiary(
					updateApiary(account, text(payload.apiaryId) ?? '', {
						name: text(payload.name),
						location: soapLocation(payload.location) ?? payload.location,
					}),
				)}</tns:UpdateApiaryResponse>`,
			);
		case 'DeleteApiary':
			deleteApiary(account, key, text(payload.apiaryId) ?? '');
			return soapEnvelope('<tns:DeleteApiaryResponse/>');
		case 'ListHives': {
			const page = listHives(account, {
				apiary_id: text(payload.apiaryId),
				status: text(payload.status),
				limit: num(payload.limit),
				cursor: text(payload.cursor),
			});
			return soapEnvelope(
				`<tns:ListHivesResponse>${page.data.map(soapHive).join('')}<tns:nextCursor${page.next_cursor ? `>${xmlEscape(page.next_cursor)}` : ' xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'}></tns:nextCursor></tns:ListHivesResponse>`,
			);
		}
		case 'CreateHive':
			return soapEnvelope(
				`<tns:CreateHiveResponse>${soapHive(
					createHive(
						account,
						{
							apiary_id: text(payload.apiaryId),
							label: text(payload.label),
							queen_installed_at: text(payload.queenInstalledAt),
						},
						text(payload.idempotencyKey),
					).value,
				)}</tns:CreateHiveResponse>`,
			);
		case 'GetHive':
			return soapEnvelope(`<tns:GetHiveResponse>${soapHive(getHive(account, text(payload.hiveId) ?? ''))}</tns:GetHiveResponse>`);
		case 'ListInspections': {
			const page = listInspections(account, text(payload.hiveId) ?? '', num(payload.limit) ?? 20, text(payload.cursor));
			return soapEnvelope(
				`<tns:ListInspectionsResponse>${page.data.map(soapInspection).join('')}<tns:nextCursor${page.next_cursor ? `>${xmlEscape(page.next_cursor)}` : ' xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'}></tns:nextCursor></tns:ListInspectionsResponse>`,
			);
		}
		case 'CreateInspection':
			return soapEnvelope(
				`<tns:CreateInspectionResponse>${soapInspection(
					createInspection(
						account,
						key,
						text(payload.hiveId) ?? '',
						{
							inspected_at: text(payload.inspectedAt),
							queen_seen: text(payload.queenSeen) === 'true',
							brood_frames: num(payload.broodFrames),
							temperament: text(payload.temperament),
							notes: text(payload.notes),
						},
						text(payload.idempotencyKey),
					).value,
				)}</tns:CreateInspectionResponse>`,
			);
		case 'ListWebhooks': {
			const endpoints = listWebhooks(account)
				.map(
					(endpoint) =>
						`<tns:endpoint><tns:id>${xmlEscape(endpoint.id)}</tns:id><tns:url>${xmlEscape(endpoint.url)}</tns:url>${endpoint.events.map((event) => `<tns:events>${event}</tns:events>`).join('')}<tns:createdAt>${endpoint.created_at}</tns:createdAt></tns:endpoint>`,
				)
				.join('');
			return soapEnvelope(`<tns:ListWebhooksResponse>${endpoints}</tns:ListWebhooksResponse>`);
		}
		case 'CreateWebhook': {
			const events = Array.isArray(payload.events) ? payload.events.map(String) : [String(payload.events ?? '')].filter(Boolean);
			const created = createWebhook(account, { url: text(payload.url), events }).value as {
				id: string;
				url: string;
				events: string[];
				created_at: string;
				secret?: string;
			};
			return soapEnvelope(
				`<tns:CreateWebhookResponse><tns:endpoint><tns:id>${xmlEscape(created.id)}</tns:id><tns:url>${xmlEscape(created.url)}</tns:url>${created.events.map((event) => `<tns:events>${event}</tns:events>`).join('')}<tns:createdAt>${created.created_at}</tns:createdAt><tns:secret>${xmlEscape(created.secret ?? '')}</tns:secret></tns:endpoint></tns:CreateWebhookResponse>`,
			);
		}
		default:
			throw new ApiError(400, 'malformed_request', 'Malformed request', `Unknown SOAP operation ${name || '(empty body)'}.`);
	}
}

const app = new Hono();
app.use(
	'*',
	cors({
		origin: '*',
		allowHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'SOAPAction'],
		allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
		exposeHeaders: ['X-RateLimit-Remaining', 'Retry-After'],
	}),
);

app.get('/health', (c) => c.json({ ok: true }));

app.get('/v1/apiaries', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		const { body, headers } = withRate(
			remaining,
			listApiaries(account, Number(c.req.query('limit') ?? 20), c.req.query('cursor')),
		);
		return c.json(body, 200, headers);
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/v1/apiaries', async (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		const input = await c.req.json();
		const created = createApiary(account, input, c.req.header('Idempotency-Key'));
		return c.json(created.value, created.status as 201, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.get('/v1/apiaries/:apiaryId', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		return c.json(getApiary(account, c.req.param('apiaryId')), 200, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.patch('/v1/apiaries/:apiaryId', async (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		const input = await c.req.json();
		return c.json(updateApiary(account, c.req.param('apiaryId'), input), 200, {
			'X-RateLimit-Remaining': String(remaining),
		});
	} catch (err) {
		return jsonError(c, err);
	}
});

app.delete('/v1/apiaries/:apiaryId', (c) => {
	try {
		const { account, key, remaining } = requireAuth(c.req.header('Authorization'));
		deleteApiary(account, key, c.req.param('apiaryId'));
		return c.body(null, 204, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.get('/v1/hives', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		return c.json(
			listHives(account, {
				apiary_id: c.req.query('apiary_id'),
				status: c.req.query('status'),
				limit: Number(c.req.query('limit') ?? 20),
				cursor: c.req.query('cursor'),
			}),
			200,
			{ 'X-RateLimit-Remaining': String(remaining) },
		);
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/v1/hives', async (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		const input = await c.req.json();
		const created = createHive(account, input, c.req.header('Idempotency-Key'));
		return c.json(created.value, created.status as 201, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.get('/v1/hives/:hiveId', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		return c.json(getHive(account, c.req.param('hiveId')), 200, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.get('/v1/hives/:hiveId/inspections', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		return c.json(
			listInspections(account, c.req.param('hiveId'), Number(c.req.query('limit') ?? 20), c.req.query('cursor')),
			200,
			{ 'X-RateLimit-Remaining': String(remaining) },
		);
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/v1/hives/:hiveId/inspections', async (c) => {
	try {
		const { account, key, remaining } = requireAuth(c.req.header('Authorization'));
		const input = await c.req.json();
		const created = createInspection(account, key, c.req.param('hiveId'), input, c.req.header('Idempotency-Key'));
		return c.json(created.value, created.status as 201, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.get('/v1/webhooks', (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		return c.json({ data: listWebhooks(account) }, 200, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/v1/webhooks', async (c) => {
	try {
		const { account, remaining } = requireAuth(c.req.header('Authorization'));
		const input = await c.req.json();
		const created = createWebhook(account, input);
		return c.json(created.value, created.status as 201, { 'X-RateLimit-Remaining': String(remaining) });
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/rpc/v1', async (c) => {
	let id: unknown = null;
	try {
		const envelope = await c.req.json();
		id = envelope?.id ?? null;
		if (envelope?.jsonrpc !== '2.0' || typeof envelope?.method !== 'string') {
			return c.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } }, 400);
		}
		const { account, key } = requireAuth(c.req.header('Authorization'));
		const result = dispatchRpc(account, key, envelope.method, envelope.params);
		return c.json({ jsonrpc: '2.0', id, result });
	} catch (err) {
		const apiErr = err instanceof ApiError ? err : new ApiError(400, 'malformed_request', 'Malformed request', 'Invalid JSON-RPC request.');
		const rpcCode = apiErr.status === 401 ? -32001 : apiErr.status === 404 ? -32004 : -32602;
		return c.json(
			{ jsonrpc: '2.0', id, error: { code: rpcCode, message: apiErr.title, data: { code: apiErr.code, detail: apiErr.detail } } },
			apiErr.status === 401 ? 401 : 200,
		);
	}
});

app.on(['GET', 'POST'], '/graphql', async (c) => {
	try {
		const { account, key } = requireAuth(c.req.header('Authorization'));
		const payload =
			c.req.method === 'GET'
				? { query: c.req.query('query'), variables: c.req.query('variables'), operationName: c.req.query('operationName') }
				: await c.req.json();
		if (!payload.query) {
			throw new ApiError(400, 'malformed_request', 'Malformed request', '`query` is required.');
		}
		const variables = typeof payload.variables === 'string' ? JSON.parse(payload.variables) : payload.variables;
		const result = await graphql({
			schema: graphqlSchema,
			source: payload.query,
			rootValue: graphqlRoot(account, key),
			contextValue: { account, key },
			variableValues: variables,
			operationName: payload.operationName,
			fieldResolver: (source, args, ctx, info) => {
				const type = wrapGraphqlNode()[info.parentType.name as keyof ReturnType<typeof wrapGraphqlNode>];
				const field = type?.[info.fieldName as never] as ((s: unknown, a: unknown, c: unknown) => unknown) | undefined;
				if (field) return field(source, args, ctx);
				if (source && typeof source === 'object' && info.fieldName in source) {
					const value = (source as Record<string, unknown>)[info.fieldName];
					if (typeof value === 'function') return value(args, ctx, info);
					return value;
				}
				return undefined;
			},
		});
		return c.json(result);
	} catch (err) {
		return jsonError(c, err);
	}
});

app.post('/soap/v1', async (c) => {
	try {
		const { account, key } = requireAuth(c.req.header('Authorization'));
		const xml = await c.req.text();
		return c.body(handleSoap(account, key, xml), 200, { 'Content-Type': 'text/xml; charset=utf-8' });
	} catch (err) {
		const apiErr = err instanceof ApiError ? err : new ApiError(400, 'malformed_request', 'Malformed request', 'Invalid SOAP envelope.');
		return c.body(soapFault(apiErr), apiErr.status === 401 ? 401 : 500, { 'Content-Type': 'text/xml; charset=utf-8' });
	}
});

const httpServer = serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) => {
	console.log(`APIculture sandbox http://${info.address}:${info.port}`);
	console.log('  REST      /v1');
	console.log('  SOAP      /soap/v1');
	console.log('  JSON-RPC  /rpc/v1');
	console.log('  GraphQL   /graphql');
	console.log('  WebSocket ws://%s:%s/v1', info.address, info.port);
	console.log('  Auth      Authorization: Bearer ak_test_…');
});

const wss = new WebSocketServer({ server: httpServer as never, path: '/v1' });

wss.on('connection', (socket: WebSocket, request) => {
	const url = new URL(request.url ?? '/v1', `http://${HOST}`);
	let listener: ReturnType<typeof subscribe> | undefined;
	const send = (payload: unknown) => socket.send(JSON.stringify(payload));

	const attach = (token: string) => {
		try {
			const { key } = authenticate(`Bearer ${token}`);
			listener = subscribe(key, (event: DomainEvent) => send(event));
			send({ op: 'ready' });
		} catch (err) {
			const apiErr = err instanceof ApiError ? err : new ApiError(401, 'unauthenticated', 'Unauthenticated', 'Invalid token.');
			socket.close(4401, apiErr.detail);
		}
	};

	const token = url.searchParams.get('token');
	if (token) attach(token);

	socket.on('message', (raw) => {
		let frame: { op?: string; token?: string; channel?: string };
		try {
			frame = JSON.parse(String(raw));
		} catch {
			send({ op: 'error', code: 'malformed_request', detail: 'Frames must be JSON.' });
			return;
		}
		if (frame.op === 'auth' && frame.token) {
			attach(frame.token);
			return;
		}
		if (!listener) {
			send({ op: 'error', code: 'unauthenticated', detail: 'Authenticate first.' });
			return;
		}
		if (frame.op === 'subscribe' && frame.channel) {
			listener.channels.add(frame.channel);
			send({ op: 'subscribed', channel: frame.channel });
			return;
		}
		if (frame.op === 'unsubscribe' && frame.channel) {
			listener.channels.delete(frame.channel);
			send({ op: 'unsubscribed', channel: frame.channel });
			return;
		}
		if (frame.op === 'ping') {
			send({ op: 'pong' });
			return;
		}
		send({ op: 'error', code: 'malformed_request', detail: 'Unknown op.' });
	});

	socket.on('close', () => {
		if (listener) unsubscribe(listener);
	});
});
