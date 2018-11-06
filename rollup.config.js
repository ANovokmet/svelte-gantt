import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

const production = !process.env.ROLLUP_WATCH;

function baseConfig({input, output, css}) {
	return {
		input: input,
		output: output,
		plugins: [
			svelte({
				// opt in to v3 behaviour today
				skipIntroByDefault: true,
				nestedTransitions: true,
	
				// enable run-time checks when not in production
				dev: !production,
				// we'll extract any component CSS out into
				// a separate file  better for performance
				css: css
			}),
	
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration 
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve(),
			commonjs(),
	
			// If we're building for production (npm run build
			// instead of npm run dev), transpile and minify
			production && buble({ include: ['src/**', 'node_modules/svelte/shared.js'] }),
			production && uglify()
		]
	}
};


export default [
	baseConfig({
		input: 'src/Gantt.html',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGantt',
			file: 'public/svelteGantt.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/svelteGantt.css');
		}
	}),
	baseConfig({
		input: 'src/modules/dependencies/GanttDependencies.html',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGanttDependencies',
			file: 'public/svelteGanttDependencies.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/svelteGanttDependencies.css');
		}
	}),
	baseConfig({
		input: 'src/modules/table/Table.html',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGanttTable',
			file: 'public/svelteGanttTable.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/svelteGanttTable.css');
		}
	})
];
