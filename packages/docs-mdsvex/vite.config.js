import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: { preserveSymlinks: true },

	optimizeDeps: {
		include: ['svelte-gantt'],
	},
	build: {
		commonjsOptions: {
			include: [/svelte-gantt/, /node_modules/],
		},
	},
	// commonjsOptions: { include: [] }
});
