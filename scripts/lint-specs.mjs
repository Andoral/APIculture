import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { buildSchema } from 'graphql';
import protobuf from 'protobufjs';
import { Parser as AsyncAPIParser } from '@asyncapi/parser';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(label, message) {
	failures.push(`${label}: ${message}`);
	console.error(`✗ ${label}\n  ${message}`);
}

function ok(label) {
	console.log(`✓ ${label}`);
}

function read(rel) {
	return readFileSync(resolve(root, rel), 'utf8');
}

const spectral = spawnSync(
	process.platform === 'win32' ? 'npx.cmd' : 'npx',
	['spectral', 'lint', 'specs/rest/**/openapi.yaml', '--fail-severity=warn'],
	{ cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);
if (spectral.status !== 0) fail('REST OpenAPI', `Spectral exited ${spectral.status}`);
else ok('REST OpenAPI (Spectral)');

try {
	const doc = JSON.parse(read('specs/rpc/v1/openrpc.json'));
	if (doc.openrpc !== '1.3.2') throw new Error(`expected openrpc 1.3.2, got ${doc.openrpc}`);
	if (!doc.info?.title || !doc.info?.version) throw new Error('info.title and info.version are required');
	if (!Array.isArray(doc.methods) || doc.methods.length === 0) throw new Error('methods must be a non-empty array');
	const names = new Set();
	for (const method of doc.methods) {
		if (!method.name) throw new Error('every method needs a name');
		if (names.has(method.name)) throw new Error(`duplicate method ${method.name}`);
		names.add(method.name);
		if (!method.result) throw new Error(`${method.name} is missing result`);
	}
	ok(`JSON-RPC OpenRPC (${doc.methods.length} methods)`);
} catch (err) {
	fail('JSON-RPC OpenRPC', err instanceof Error ? err.message : String(err));
}

try {
	buildSchema(read('specs/graphql/v1/schema.graphql'));
	ok('GraphQL SDL');
} catch (err) {
	fail('GraphQL SDL', err instanceof Error ? err.message : String(err));
}

try {
	const parsed = new XMLParser({ ignoreAttributes: false }).parse(read('specs/soap/v1/apiculture.wsdl'));
	const defs = parsed.definitions ?? parsed['wsdl:definitions'];
	if (!defs) throw new Error('missing wsdl:definitions');
	const portType = defs.portType ?? defs['wsdl:portType'];
	const operations = portType?.operation ?? portType?.['wsdl:operation'];
	const list = Array.isArray(operations) ? operations : operations ? [operations] : [];
	if (list.length === 0) throw new Error('portType has no operations');
	const required = [
		'ListApiaries',
		'CreateApiary',
		'GetApiary',
		'UpdateApiary',
		'DeleteApiary',
		'ListHives',
		'CreateHive',
		'GetHive',
		'ListInspections',
		'CreateInspection',
		'ListWebhooks',
		'CreateWebhook',
	];
	const names = new Set(list.map((op) => op['@_name'] || op.name));
	const missing = required.filter((name) => !names.has(name));
	if (missing.length) throw new Error(`missing operations: ${missing.join(', ')}`);
	ok(`SOAP WSDL (${list.length} operations)`);
} catch (err) {
	fail('SOAP WSDL', err instanceof Error ? err.message : String(err));
}

try {
	const rootProto = await protobuf.load(resolve(root, 'specs/grpc/v1/apiculture.proto'));
	const found = [];
	rootProto.nestedArray?.forEach(function walk(ns) {
		if (ns instanceof protobuf.Service) found.push(ns.name);
		if (ns.nestedArray) ns.nestedArray.forEach(walk);
	});
	if (!found.includes('ApiaryService')) throw new Error(`expected ApiaryService, found ${found.join(', ') || 'none'}`);
	ok(`gRPC proto (${found.join(', ')})`);
} catch (err) {
	fail('gRPC proto', err instanceof Error ? err.message : String(err));
}

try {
	const { document, diagnostics } = await new AsyncAPIParser().parse(read('specs/websocket/v1/asyncapi.yaml'));
	const errors = (diagnostics ?? []).filter((item) => item.severity === 'error');
	if (errors.length) throw new Error(errors.map((item) => item.message).join('; '));
	if (!document) throw new Error('parser returned no document');
	ok('WebSocket AsyncAPI');
} catch (err) {
	fail('WebSocket AsyncAPI', err instanceof Error ? err.message : String(err));
}

if (failures.length) {
	console.error(`\n${failures.length} specification check(s) failed.`);
	process.exit(1);
}
console.log('\nAll specifications passed.');
