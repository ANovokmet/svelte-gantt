import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/docs-mdsvex/vite.config.js',
  './packages/svelte-gantt/vitest.config.ts',
  './packages/playground/vite.config.ts',
  './packages/demo/vite.config.js'
]);
