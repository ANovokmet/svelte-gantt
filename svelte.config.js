/** used exclusively for packaging with svelte-package */
// import { vitePreprocess as sveltePreprocess } from '@sveltejs/kit/vite';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: sveltePreprocess()
};

export default config;
