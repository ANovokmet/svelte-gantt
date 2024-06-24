<script lang="ts">
	import { page } from '$app/stores';	
	import { base } from '$app/paths';

	export let href;
	export let label;

	$: isActive = $page.url.pathname.includes(href);
</script>

<a
	class="
		lg:py-1 -ml-px flex items-center border-l py-2 pl-4 transition-all
		{isActive
		? 'text-brand font-semibold border-brand'
		: 'hover:border-inverse focus-visible:border-inverse text-soft hover:text-inverse focus-visible:text-inverse border-transparent font-normal'}"
	href="{base}{href}"
>
	{label}
</a>
