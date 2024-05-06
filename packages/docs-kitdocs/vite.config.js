import { sveltekit } from '@sveltejs/kit/vite';
import icons from 'unplugin-icons/vite';
import kitDocs from '@svelteness/kit-docs/node';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [icons({ compiler: 'svelte' }), kitDocs(), sveltekit()],
};

export default config;
