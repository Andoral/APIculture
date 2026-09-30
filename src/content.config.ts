import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Starlight emits `hero.actions[].link` verbatim, without Astro's `base`.
 * Prefix root-relative links here so the landing page works under a sub-path
 * (GitHub Pages at /APIculture/) as well as on a root domain.
 */
const withBase = (href: string) =>
	base && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(`${base}/`)
		? `${base}${href}`
		: href;

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: (context) =>
			docsSchema()(context).transform((data) => {
				if (data.hero?.actions) {
					data.hero.actions = data.hero.actions.map((action) => ({
						...action,
						link: withBase(action.link),
					}));
				}
				return data;
			}),
	}),
};
