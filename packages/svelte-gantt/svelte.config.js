/** used exclusively for packaging with svelte-package */
// import { vitePreprocess as sveltePreprocess } from '@sveltejs/kit/vite';
// import { sveltePreprocess } from 'svelte-preprocess';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
//   preprocess: sveltePreprocess()
// };

// export default config;
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: [vitePreprocess()],
}
