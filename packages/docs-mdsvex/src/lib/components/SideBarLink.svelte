<script lang="ts">
	import { page } from '$app/stores';

	export let href;
  export let label;

	function isActive(link) {
		return $page.url.pathname.includes(href);
	}
</script>

<a
	class={`992:py-1 -ml-px flex items-center border-l py-2 pl-4 ${
		isActive(href)
			? 'text-brand font-semibold'
			: 'hover:border-inverse focus-visible:border-inverse text-soft hover:text-inverse focus-visible:text-inverse border-transparent font-normal'
	}`}
	{href}
	style={isActive(href) ? 'border-color: var(--kd-sidebar-border-active);' : ''}
>
  {label}
</a>
