/**
 * Sätteri HAST plugin: prefixes root-relative links (`/guides/…`) written in
 * Markdown/MDX with Astro's `base`.
 *
 * Astro and Starlight only apply `base` to links they generate themselves
 * (sidebar slugs, assets). Links typed by authors in Markdown, and `href`/`link`
 * props on MDX components such as <Card> and <LinkCard>, are emitted verbatim.
 * This plugin closes that gap so the same content works both on a root domain
 * and under a sub-path (e.g. GitHub Pages at /APIculture/).
 *
 * @param {{ base: string, components?: string[] }} options
 * @returns {import('satteri').HastPluginDefinition}
 */
export default function satteriBaseLinks({
	base,
	components = ['Card', 'LinkCard', 'LinkButton'],
}) {
	const prefix = base.replace(/\/$/, '');

	const rewrite = (href) =>
		typeof href === 'string' &&
		href.startsWith('/') &&
		!href.startsWith('//') &&
		!href.startsWith(`${prefix}/`) &&
		href !== prefix
			? `${prefix}${href}`
			: undefined;

	/** @type {import('satteri').HastFilteredVisitor<any>} */
	const jsxVisitor = {
		filter: components,
		visit(node, ctx) {
			for (const attr of node.attributes ?? []) {
				if (attr.type !== 'mdxJsxAttribute' || (attr.name !== 'href' && attr.name !== 'link')) continue;
				const next = rewrite(attr.value);
				if (next !== undefined) ctx.setProperty(node, attr.name, next);
			}
		},
	};

	return {
		name: 'base-links',
		element: prefix
			? {
					filter: ['a'],
					visit(node, ctx) {
						const next = rewrite(node.properties?.href);
						if (next !== undefined) ctx.setProperty(node, 'href', next);
					},
				}
			: undefined,
		mdxJsxFlowElement: prefix ? jsxVisitor : undefined,
		mdxJsxTextElement: prefix ? jsxVisitor : undefined,
	};
}
