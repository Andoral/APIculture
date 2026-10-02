import type { APIRoute } from 'astro';

/** Serve a contract file as a static download with CORS, so reference UIs can fetch it. */
export function serveSpec(body: string, contentType: string): APIRoute {
	return () =>
		new Response(body, {
			headers: {
				'Content-Type': `${contentType}; charset=utf-8`,
				'Access-Control-Allow-Origin': '*',
			},
		});
}
