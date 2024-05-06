import { createKitDocsLoader } from '@svelteness/kit-docs';

export const prerender = true;
export const ssr = false;

/** @type {import('./$types').LayoutLoad} */
export const load = createKitDocsLoader({
  sidebar: {
    '/': null,
    '/docs': '/docs',
  },
});
