// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import satteriBaseLinks from './src/plugins/satteri-base-links.mjs';

// `site` and `base` are provided by CI so the same build works both on
// GitHub Pages (served under /APIculture/) and on a root domain (previews, custom domain).
const site = process.env.ASTRO_SITE || 'http://localhost:4321';
const base = process.env.ASTRO_BASE || '/';
/** @param {string} path */
const withBase = (path) => `${base.replace(/\/$/, '')}${path}`;

// https://astro.build/config
export default defineConfig({
	site,
	base,
	markdown: {
		processor: satteri({ hastPlugins: [satteriBaseLinks({ base })] }),
	},
	vite: {
		assetsInclude: ['**/*.wsdl', '**/*.proto', '**/*.graphql'],
	},
	redirects: {
		'/reference/v1': '/reference/rest/v1',
		'/openapi/v1.yaml': '/specs/rest/v1.yaml',
		'/getting-started/quickstart': '/rest/quickstart',
		'/guides/pagination': '/rest/guides/pagination',
		'/guides/idempotency': '/rest/guides/idempotency',
		'/guides/webhooks': '/rest/guides/webhooks',
		'/guides/rate-limits': '/rest/guides/rate-limits',
	},
	integrations: [
		starlight({
			title: 'APIculture',
			description: 'Developer documentation for APIculture.',
			favicon: '/favicon.svg',
			logo: { src: './src/assets/honeycomb.svg', alt: 'APIculture honeycomb' },
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/Andoral/APIculture' },
			],
			lastUpdated: true,
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Architecture & concepts', slug: '' },
						{ label: 'Authentication', slug: 'getting-started/authentication' },
						{ label: 'Local sandbox', slug: 'getting-started/sandbox' },
					],
				},
				{
					label: 'REST',
					badge: { text: 'stable', variant: 'success' },
					items: [
						{ label: 'Overview', slug: 'rest' },
						{ label: 'Quickstart', slug: 'rest/quickstart' },
						{ label: 'Guides', items: [{ autogenerate: { directory: 'rest/guides' } }] },
						{
							label: 'Reference v1',
							link: withBase('/reference/rest/v1/'),
							badge: { text: 'Scalar', variant: 'note' },
						},
					],
				},
				{
					label: 'SOAP',
					items: [
						{ label: 'Overview', slug: 'soap' },
						{ label: 'Quickstart', slug: 'soap/quickstart' },
						{ label: 'Reference v1', slug: 'soap/reference', badge: { text: 'WSDL', variant: 'note' } },
					],
				},
				{
					label: 'JSON-RPC',
					items: [
						{ label: 'Overview', slug: 'rpc' },
						{ label: 'Quickstart', slug: 'rpc/quickstart' },
						{ label: 'Reference v1', slug: 'rpc/reference', badge: { text: 'OpenRPC', variant: 'note' } },
					],
				},
				{
					label: 'gRPC',
					items: [
						{ label: 'Overview', slug: 'grpc' },
						{ label: 'Quickstart', slug: 'grpc/quickstart' },
						{ label: 'Reference v1', slug: 'grpc/reference', badge: { text: 'Protobuf', variant: 'note' } },
					],
				},
				{
					label: 'GraphQL',
					items: [
						{ label: 'Overview', slug: 'graphql' },
						{ label: 'Quickstart', slug: 'graphql/quickstart' },
						{ label: 'Reference v1', slug: 'graphql/reference', badge: { text: 'SDL', variant: 'note' } },
					],
				},
				{
					label: 'WebSocket',
					items: [
						{ label: 'Overview', slug: 'websocket' },
						{ label: 'Quickstart', slug: 'websocket/quickstart' },
						{ label: 'Reference v1', slug: 'websocket/reference', badge: { text: 'AsyncAPI', variant: 'note' } },
						{
							label: 'Explorer v1',
							link: withBase('/reference/websocket/v1/'),
							badge: { text: 'Scalar', variant: 'note' },
						},
					],
				},
				{
					label: 'Resources',
					items: [
						{ label: 'Specifications', slug: 'reference' },
						{ label: 'Errors', slug: 'resources/errors' },
						{ label: 'Versioning & deprecation', slug: 'resources/versioning' },
						{ label: 'SDKs', slug: 'resources/sdks' },
						{ label: 'Changelog', slug: 'changelog' },
					],
				},
			],
		}),
	],
});
