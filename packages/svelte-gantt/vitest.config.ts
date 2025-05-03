import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {		
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'], // Include test files
    coverage: {
      reporter: ['text', 'json', 'html'], // Coverage reporters
      include: ['src/**/*.{ts,svelte}'], // Include source files for coverage
    },
  },
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined
})