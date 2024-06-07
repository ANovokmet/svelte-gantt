<script lang="ts">
	import { page } from '$app/stores';

	export let href;
	export let label;

	$: isActive = $page.url.pathname.includes(href);
</script>

<a
	class={`lg:py-1 -ml-px flex items-center border-l py-2 pl-4 ${
		isActive ? 'text-violet-500 font-semibold border-violet-600' : 'hover:border-inverse focus-visible:border-inverse text-soft hover:text-inverse focus-visible:text-inverse border-transparent font-normal'
	}`}
	{href}
>
	{label}
</a>
