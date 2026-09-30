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
	integrations: [
		starlight({
			title: 'APIculture API',
			description: 'Developer documentation for the APIculture API.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/Andoral/APIculture' },
			],
			editLink: {
				baseUrl: 'https://github.com/Andoral/APIculture/edit/main/',
			},
			lastUpdated: true,
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: '' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
						{ label: 'Authentication', slug: 'getting-started/authentication' },
					],
				},
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
				{
					label: 'Concepts',
					items: [{ autogenerate: { directory: 'concepts' } }],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Overview', slug: 'reference' },
						{ label: 'v1 (current)', link: withBase('/reference/v1/'), badge: { text: 'stable', variant: 'success' } },
					],
				},
				{
					label: 'Resources',
					items: [
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
