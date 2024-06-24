<script lang="ts">
	import { base } from '$app/paths';

	export let href: string;
</script>

<a href={href.startsWith('/') ? `${base}${href}` : href}>
	<slot />
</a>
