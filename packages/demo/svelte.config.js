import adapter from '@sveltejs/adapter-static';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: process.env.NODE_ENV === 'production' ? '../docs' : 'build',
            fallback: '404.html',
            precompress: false,
            strict: true
        }),
        paths: {
            relative: true,
            base: process.env.NODE_ENV === 'production' ? '/svelte-gantt' : '',
        },
        alias: {
            '$dist': path.resolve('../svelte-gantt/dist'),
            'svelte-gantt': path.resolve('../svelte-gantt/dist'),
        }
    }
};

export default config;
