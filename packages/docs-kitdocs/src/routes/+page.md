{@html `<style>.on-this-page { display: none; }</style>`}
<div class="prose" style="max-width: 992px; margin: 0 auto; margin-top: 3rem">

# Welcome to KitDocs

This your home page. Feel free to change it to a Svelte file by renaming it to `+page.svelte`.

## Redirecting

You might want the home page to be the first page of your documentation. If this is the case,
rename this file to `+page.js` and replace the content of this file with the following:

```js copy
import { redirect } from '@sveltejs/kit';

export const prerender = true;

/** @type {import('./$types').PageLoad} */
export function load() {
  throw redirect(307, '/docs');
}
```

</div>

