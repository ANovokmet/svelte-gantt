import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePluginWatchWorkspace } from './vite-plugin-watch-workspace';
import * as path from 'path';
export default defineConfig({
	plugins: [
		VitePluginWatchWorkspace({
			workspaceRoot: path.join(__dirname, '../..'),
			currentPackage: __dirname,
			format: 'esm',
			fileTypes: ['svelte', 'ts', 'js'],
			ignorePaths: ['node_modules', 'dist']
		}),
		sveltekit()
	]
	// resolve: { preserveSymlinks: true },
	// optimizeDeps: {
	// 	include: ['svelte-gantt'],
	// },
	// build: {
	// 	commonjsOptions: {
	// 		include: [/svelte-gantt/, /node_modules/],
	// 	},
	// },
	// commonjsOptions: { include: [] }
});
