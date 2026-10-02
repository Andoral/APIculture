import { createHash, randomBytes } from 'node:crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		readonly title: string,
		readonly detail: string,
		readonly errors?: { field: string; message: string }[],
	) {
		super(detail);
		this.name = 'ApiError';
	}
}

export type GeoPoint = { latitude: number; longitude: number };
export type HiveStatus = 'active' | 'swarmed' | 'queenless' | 'dead' | 'archived';
export type Temperament = 'calm' | 'nervous' | 'aggressive';
export type WebhookEventType = 'inspection.created' | 'hive.status_changed' | 'apiary.deleted';

export type Apiary = {
	id: string;
	name: string;
	location?: GeoPoint;
	created_at: string;
};
export type Hive = {
	id: string;
	apiary_id: string;
	label: string;
	status: HiveStatus;
	queen_installed_at?: string;
	last_inspected_at: string | null;
	created_at: string;
	updated_at: string;
};
export type Inspection = {
	id: string;
	hive_id: string;
	inspected_at: string;
	queen_seen: boolean;
	brood_frames?: number;
	temperament?: Temperament;
	notes?: string;
	created_at: string;
};
export type WebhookEndpoint = {
	id: string;
	url: string;
	events: WebhookEventType[];
	created_at: string;
	secret: string;
};
export type DomainEvent = {
	id: string;
	type: WebhookEventType;
	created_at: string;
	data: Record<string, unknown>;
};

export type Page<T> = { data: T[]; next_cursor: string | null };

type IdempotencyRecord = { hash: string; status: number; body: unknown };

export type Account = {
	apiaries: Map<string, Apiary>;
	hives: Map<string, Hive>;
	inspections: Map<string, Inspection>;
	webhooks: Map<string, WebhookEndpoint>;
	idempotency: Map<string, IdempotencyRecord>;
	rate: { windowStart: number; count: number };
};

type Listener = { key: string; channels: Set<string>; send: (event: DomainEvent) => void };

const HIVE_STATUSES = new Set<HiveStatus>(['active', 'swarmed', 'queenless', 'dead', 'archived']);
const TEMPERAMENTS = new Set<Temperament>(['calm', 'nervous', 'aggressive']);
const EVENT_TYPES = new Set<WebhookEventType>([
	'inspection.created',
	'hive.status_changed',
	'apiary.deleted',
]);

const accounts = new Map<string, Account>();
const listeners = new Set<Listener>();

export function ulid(): string {
	let time = Date.now();
	let timePart = '';
	for (let i = 0; i < 10; i++) {
		timePart = CROCKFORD[time % 32] + timePart;
		time = Math.floor(time / 32);
	}
	const bytes = randomBytes(16);
	let rand = '';
	for (let i = 0; i < 16; i++) rand += CROCKFORD[bytes[i]! % 32];
	return timePart + rand;
}

export function prefixedId(prefix: 'ap' | 'hv' | 'in' | 'wh' | 'evt'): string {
	return `${prefix}_${ulid()}`;
}

export function nowIso(): string {
	return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function getAccount(key: string): Account {
	let account = accounts.get(key);
	if (!account) {
		account = {
			apiaries: new Map(),
			hives: new Map(),
			inspections: new Map(),
			webhooks: new Map(),
			idempotency: new Map(),
			rate: { windowStart: Date.now(), count: 0 },
		};
		accounts.set(key, account);
	}
	return account;
}

export function consumeRate(account: Account, limit = 120): number {
	const now = Date.now();
	if (now - account.rate.windowStart >= 60_000) {
		account.rate = { windowStart: now, count: 0 };
	}
	account.rate.count += 1;
	if (account.rate.count > limit) {
		throw new ApiError(429, 'rate_limited', 'Too many requests', 'Rate limit exceeded. Retry after Retry-After seconds.');
	}
	return Math.max(0, limit - account.rate.count);
}

export function authenticate(header: string | undefined): { key: string; account: Account } {
	if (!header) {
		throw new ApiError(401, 'unauthenticated', 'Unauthenticated', 'Missing Authorization header.');
	}
	const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
	if (!match) {
		throw new ApiError(401, 'unauthenticated', 'Unauthenticated', 'Authorization header must be Bearer <key>.');
	}
	const key = match[1]!;
	if (key.startsWith('ak_live_')) {
		throw new ApiError(401, 'unauthenticated', 'Unauthenticated', 'Live keys are rejected by the sandbox.');
	}
	if (!key.startsWith('ak_test_')) {
		throw new ApiError(401, 'unauthenticated', 'Unauthenticated', 'Sandbox keys must start with ak_test_.');
	}
	return { key, account: getAccount(key) };
}

function encodeCursor(id: string): string {
	return Buffer.from(id, 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): string {
	try {
		return Buffer.from(cursor, 'base64url').toString('utf8');
	} catch {
		throw new ApiError(400, 'invalid_cursor', 'Invalid cursor', 'The cursor is expired, tampered with, or used with different filters.');
	}
}

function paginate<T extends { id: string; created_at: string }>(
	items: T[],
	limit = 20,
	cursor?: string | null,
): Page<T> {
	const size = clampLimit(limit);
	const sorted = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
	let start = 0;
	if (cursor) {
		const id = decodeCursor(cursor);
		const idx = sorted.findIndex((item) => item.id === id);
		if (idx === -1) {
			throw new ApiError(400, 'invalid_cursor', 'Invalid cursor', 'The cursor is expired, tampered with, or used with different filters.');
		}
		start = idx + 1;
	}
	const data = sorted.slice(start, start + size);
	const next = start + size < sorted.length ? encodeCursor(data[data.length - 1]!.id) : null;
	return { data, next_cursor: next };
}

function clampLimit(limit: number): number {
	if (!Number.isFinite(limit) || limit < 1) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`limit` must be between 1 and 100.', [
			{ field: 'limit', message: 'must be between 1 and 100' },
		]);
	}
	return Math.min(100, Math.floor(limit));
}

function hashBody(body: unknown): string {
	return createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
}

export function remember<T>(
	account: Account,
	scope: string,
	idempotencyKey: string | undefined,
	body: unknown,
	create: () => { status: number; value: T },
): { status: number; value: T } {
	if (!idempotencyKey) return create();
	if (idempotencyKey.length > 255) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`Idempotency-Key` must be at most 255 characters.', [
			{ field: 'Idempotency-Key', message: 'must be at most 255 characters' },
		]);
	}
	const slot = `${scope}:${idempotencyKey}`;
	const existing = account.idempotency.get(slot);
	const digest = hashBody(body);
	if (existing) {
		if (existing.hash !== digest) {
			throw new ApiError(
				422,
				'idempotency_key_reused',
				'Idempotency key reused',
				'Same Idempotency-Key sent with a different body.',
			);
		}
		return { status: existing.status, value: existing.body as T };
	}
	const created = create();
	account.idempotency.set(slot, { hash: digest, status: created.status, body: created.value });
	return created;
}

export function publicApiary(account: Account, apiary: Apiary) {
	let hive_count = 0;
	for (const hive of account.hives.values()) if (hive.apiary_id === apiary.id) hive_count += 1;
	return { ...apiary, hive_count };
}

export function publicWebhook(endpoint: WebhookEndpoint, includeSecret = false) {
	const { secret, ...rest } = endpoint;
	return includeSecret ? { ...rest, secret } : rest;
}

export function subscribe(key: string, send: (event: DomainEvent) => void): Listener {
	const listener: Listener = { key, channels: new Set(), send };
	listeners.add(listener);
	return listener;
}

export function unsubscribe(listener: Listener): void {
	listeners.delete(listener);
}

function emit(accountKey: string, event: DomainEvent, channels: string[]): void {
	for (const listener of listeners) {
		if (listener.key !== accountKey) continue;
		if (channels.some((channel) => listener.channels.has(channel))) listener.send(event);
	}
}

function requireName(name: unknown, field = 'name'): string {
	if (typeof name !== 'string' || name.trim().length === 0 || name.length > 120) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', `\`${field}\` must be 1–120 characters.`, [
			{ field, message: 'must be 1–120 characters' },
		]);
	}
	return name;
}

function optionalLocation(location: unknown): GeoPoint | undefined {
	if (location == null) return undefined;
	if (typeof location !== 'object') {
		throw new ApiError(400, 'malformed_request', 'Malformed request', '`location` must be an object.');
	}
	const { latitude, longitude } = location as { latitude?: unknown; longitude?: unknown };
	const lat = typeof latitude === 'number' ? latitude : Number(latitude);
	const lng = typeof longitude === 'number' ? longitude : Number(longitude);
	if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`location.latitude` must be between -90 and 90.', [
			{ field: 'location.latitude', message: 'must be between -90 and 90' },
		]);
	}
	if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`location.longitude` must be between -180 and 180.', [
			{ field: 'location.longitude', message: 'must be between -180 and 180' },
		]);
	}
	return { latitude: lat, longitude: lng };
}

export function listApiaries(account: Account, limit = 20, cursor?: string | null): Page<ReturnType<typeof publicApiary>> {
	const page = paginate([...account.apiaries.values()], limit, cursor);
	return { data: page.data.map((apiary) => publicApiary(account, apiary)), next_cursor: page.next_cursor };
}

export function createApiary(
	account: Account,
	input: { name?: unknown; location?: unknown },
	idempotencyKey?: string,
): { status: number; value: ReturnType<typeof publicApiary> } {
	return remember(account, 'createApiary', idempotencyKey, input, () => {
		const apiary: Apiary = {
			id: prefixedId('ap'),
			name: requireName(input.name),
			location: optionalLocation(input.location),
			created_at: nowIso(),
		};
		account.apiaries.set(apiary.id, apiary);
		return { status: 201, value: publicApiary(account, apiary) };
	});
}

export function getApiary(account: Account, id: string): ReturnType<typeof publicApiary> {
	const apiary = account.apiaries.get(id);
	if (!apiary) throw new ApiError(404, 'not_found', 'Not found', 'The apiary does not exist or is not visible to this account.');
	return publicApiary(account, apiary);
}

export function updateApiary(
	account: Account,
	id: string,
	input: { name?: unknown; location?: unknown },
): ReturnType<typeof publicApiary> {
	const apiary = account.apiaries.get(id);
	if (!apiary) throw new ApiError(404, 'not_found', 'Not found', 'The apiary does not exist or is not visible to this account.');
	if (input.name !== undefined) apiary.name = requireName(input.name);
	if (input.location !== undefined) apiary.location = optionalLocation(input.location);
	return publicApiary(account, apiary);
}

export function deleteApiary(account: Account, accountKey: string, id: string): void {
	const apiary = account.apiaries.get(id);
	if (!apiary) throw new ApiError(404, 'not_found', 'Not found', 'The apiary does not exist or is not visible to this account.');
	for (const hive of account.hives.values()) {
		if (hive.apiary_id === id) {
			throw new ApiError(409, 'apiary_not_empty', 'Conflict', 'The apiary still contains hives. Move or delete them first.');
		}
	}
	account.apiaries.delete(id);
	const event: DomainEvent = {
		id: prefixedId('evt'),
		type: 'apiary.deleted',
		created_at: nowIso(),
		data: { id },
	};
	emit(accountKey, event, [`apiary.${id}.deleted`]);
}

export function listHives(
	account: Account,
	opts: { apiary_id?: string; status?: string; limit?: number; cursor?: string | null },
): Page<Hive> {
	let items = [...account.hives.values()];
	if (opts.apiary_id) items = items.filter((hive) => hive.apiary_id === opts.apiary_id);
	if (opts.status) {
		if (!HIVE_STATUSES.has(opts.status as HiveStatus)) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`status` is not a known hive status.', [
				{ field: 'status', message: 'must be one of active, swarmed, queenless, dead, archived' },
			]);
		}
		items = items.filter((hive) => hive.status === opts.status);
	} else {
		items = items.filter((hive) => hive.status !== 'archived');
	}
	return paginate(items, opts.limit ?? 20, opts.cursor);
}

export function createHive(
	account: Account,
	input: { apiary_id?: unknown; label?: unknown; queen_installed_at?: unknown },
	idempotencyKey?: string,
): { status: number; value: Hive } {
	return remember(account, 'createHive', idempotencyKey, input, () => {
		const apiaryId = String(input.apiary_id ?? '');
		if (!account.apiaries.has(apiaryId)) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`apiary_id` must refer to an existing apiary.', [
				{ field: 'apiary_id', message: 'must refer to an existing apiary' },
			]);
		}
		if (typeof input.label !== 'string' || input.label.trim().length === 0 || input.label.length > 60) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`label` must be 1–60 characters.', [
				{ field: 'label', message: 'must be 1–60 characters' },
			]);
		}
		for (const hive of account.hives.values()) {
			if (hive.apiary_id === apiaryId && hive.label === input.label) {
				throw new ApiError(422, 'validation_failed', 'Validation failed', '`label` must be unique within the apiary.', [
					{ field: 'label', message: 'must be unique within the apiary' },
				]);
			}
		}
		const hive: Hive = {
			id: prefixedId('hv'),
			apiary_id: apiaryId,
			label: input.label,
			status: 'active',
			queen_installed_at: typeof input.queen_installed_at === 'string' ? input.queen_installed_at : undefined,
			last_inspected_at: null,
			created_at: nowIso(),
			updated_at: nowIso(),
		};
		account.hives.set(hive.id, hive);
		return { status: 201, value: hive };
	});
}

export function getHive(account: Account, id: string): Hive {
	const hive = account.hives.get(id);
	if (!hive) throw new ApiError(404, 'not_found', 'Not found', 'The hive does not exist or is not visible to this account.');
	return hive;
}

export function listInspections(account: Account, hiveId: string, limit = 20, cursor?: string | null): Page<Inspection> {
	getHive(account, hiveId);
	return paginate(
		[...account.inspections.values()].filter((item) => item.hive_id === hiveId),
		limit,
		cursor,
	);
}

export function createInspection(
	account: Account,
	accountKey: string,
	hiveId: string,
	input: {
		inspected_at?: unknown;
		queen_seen?: unknown;
		brood_frames?: unknown;
		temperament?: unknown;
		notes?: unknown;
	},
	idempotencyKey?: string,
): { status: number; value: Inspection } {
	return remember(account, `createInspection:${hiveId}`, idempotencyKey, input, () => {
		const hive = getHive(account, hiveId);
		if (typeof input.inspected_at !== 'string' || Number.isNaN(Date.parse(input.inspected_at))) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`inspected_at` must be an RFC 3339 timestamp.', [
				{ field: 'inspected_at', message: 'must be an RFC 3339 timestamp' },
			]);
		}
		if (input.brood_frames != null) {
			if (typeof input.brood_frames !== 'number' || input.brood_frames < 0 || input.brood_frames > 20) {
				throw new ApiError(422, 'validation_failed', 'Validation failed', '`brood_frames` must be between 0 and 20.', [
					{ field: 'brood_frames', message: 'must be between 0 and 20' },
				]);
			}
		}
		if (input.temperament != null && !TEMPERAMENTS.has(input.temperament as Temperament)) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`temperament` must be calm, nervous or aggressive.', [
				{ field: 'temperament', message: 'must be calm, nervous or aggressive' },
			]);
		}
		if (input.notes != null && (typeof input.notes !== 'string' || input.notes.length > 2000)) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`notes` must be at most 2000 characters.', [
				{ field: 'notes', message: 'must be at most 2000 characters' },
			]);
		}
		const inspection: Inspection = {
			id: prefixedId('in'),
			hive_id: hiveId,
			inspected_at: input.inspected_at,
			queen_seen: Boolean(input.queen_seen),
			brood_frames: typeof input.brood_frames === 'number' ? input.brood_frames : undefined,
			temperament: typeof input.temperament === 'string' ? (input.temperament as Temperament) : undefined,
			notes: typeof input.notes === 'string' ? input.notes : undefined,
			created_at: nowIso(),
		};
		account.inspections.set(inspection.id, inspection);
		hive.last_inspected_at = inspection.inspected_at;
		hive.updated_at = nowIso();
		const event: DomainEvent = {
		id: prefixedId('evt'),
		type: 'inspection.created',
			created_at: inspection.created_at,
			data: inspection,
		};
		emit(accountKey, event, [`hive.${hiveId}.inspections`]);
		return { status: 201, value: inspection };
	});
}

export function listWebhooks(account: Account) {
	return [...account.webhooks.values()].map((endpoint) => publicWebhook(endpoint));
}

export function createWebhook(
	account: Account,
	input: { url?: unknown; events?: unknown },
): { status: number; value: ReturnType<typeof publicWebhook> } {
	if (typeof input.url !== 'string' || !input.url.startsWith('https://')) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`url` must be an https:// URL.', [
			{ field: 'url', message: 'must use https://' },
		]);
	}
	if (!Array.isArray(input.events) || input.events.length === 0) {
		throw new ApiError(422, 'validation_failed', 'Validation failed', '`events` must contain at least one event type.', [
			{ field: 'events', message: 'must contain at least one event type' },
		]);
	}
	const events = input.events.map(String);
	for (const event of events) {
		if (!EVENT_TYPES.has(event as WebhookEventType)) {
			throw new ApiError(422, 'validation_failed', 'Validation failed', '`events` contains an unknown type.', [
				{ field: 'events', message: `${event} is not a known event type` },
			]);
		}
	}
	const endpoint: WebhookEndpoint = {
		id: prefixedId('wh'),
		url: input.url,
		events: [...new Set(events)] as WebhookEventType[],
		created_at: nowIso(),
		secret: `whsec_${ulid()}`,
	};
	account.webhooks.set(endpoint.id, endpoint);
	return { status: 201, value: publicWebhook(endpoint, true) };
}
