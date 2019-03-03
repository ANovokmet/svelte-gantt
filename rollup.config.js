import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import typescript from 'rollup-plugin-typescript2';

const production = !process.env.ROLLUP_WATCH;

const tsconfig = {
	compilerOptions: {
		sourceMap: true,
		target: 'es6'
	}
}

function baseConfig({input, output, css}) {
	return {
		input: input,
		output: output,
		plugins: [
			typescript({ tsconfigDefaults: tsconfig }),
			svelte({

				// if we want preprocess svelte scripts from typescript
				// preprocess: {
				// 	script: ({ content, attributes }) => {
				// 		if (attributes.type !== 'text/typescript') return;
				// 		console.log("SOURCE: ", content)
				// 		let result = ts.transpileModule(content, {
				// 			compilerOptions: { module: ts.ModuleKind.ES2015, sourceMap:true }
				// 		});
				// 		console.log("RESULT: ", result);
				// 		console.log({ code: result.outputText, map: JSON.parse(result.sourceMapText) })
				// 		return { code: result.outputText, map: JSON.parse(result.sourceMapText) }; 
				// 	}
				// },

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
			file: 'public/dist/svelteGantt.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/dist/svelteGantt.css');
		}
	}),
	baseConfig({
		input: 'src/modules/dependencies/GanttDependencies.html',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGanttDependencies',
			file: 'public/dist/svelteGanttDependencies.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/dist/svelteGanttDependencies.css');
		}
	}),
	baseConfig({
		input: 'src/modules/table/Table.html',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGanttTable',
			file: 'public/dist/svelteGanttTable.js',
			external: ['moment']
		},
		css: css => {
			css.write('public/dist/svelteGanttTable.css');
		}
	}),
	{
		input: 'src/ExternalDiv.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'SvelteGanttExternal',
			file: 'public/dist/svelteGanttExternal.js'
		},
		plugins: [
			typescript({ tsconfigDefaults: tsconfig }),
			resolve(),
			commonjs(),
			production && buble({ include: ['src/**', 'node_modules/svelte/shared.js'] }),
			production && uglify()
		]
	}
];
