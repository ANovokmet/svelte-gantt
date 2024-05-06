import adapter from '@sveltejs/adapter-auto';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],

  kit: {
    adapter: adapter(),

    prerender: {
      entries: ['*'],
      handleMissingId: 'warn',
    },
		alias:{
			'$dist': path.resolve('../dist'),
			'svelte-gantt': path.resolve('../dist'),
		}
  },
};

export default config;
