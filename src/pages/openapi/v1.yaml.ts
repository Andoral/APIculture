/**
 * Serves the OpenAPI document from `openapi/v1/openapi.yaml` as a static file
 * at `/openapi/v1.yaml`, so the spec at the repository root stays the single
 * source of truth and is never copied by hand.
 */
import type { APIRoute } from 'astro';
import spec from '../../../openapi/v1/openapi.yaml?raw';

export const GET: APIRoute = () =>
	new Response(spec, {
		headers: {
			'Content-Type': 'application/yaml; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
		},
	});
