import adapter from '@sveltejs/adapter-auto';
// import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [
		mdsvex({
			remarkPlugins: [],
			rehypePlugins: [
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'append',
						properties: { class: 'header-anchor', ariaHidden: true },
						headingProperties: { tabIndex: -1 },
						content: { type: 'text', value: '#' }
					}
				]
			]
		}),
		vitePreprocess()
	],
	// kit: {
	// 	// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
	// 	// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
	// 	// See https://kit.svelte.dev/docs/adapters for more information about adapters.
	// 	adapter: adapter()
	// }    
	kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: process.env.NODE_ENV === 'production' ? '../../docs' : 'build',
            fallback: '404.html',
            precompress: false,
            strict: true
        }),
        paths: {
            relative: true,
            base: process.env.NODE_ENV === 'production' ? '/svelte-gantt' : '',
        },
    }
};

export default config;
