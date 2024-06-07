<script>
	export let href = null;
</script>

<svelte:element this={href ? 'a' : 'button'} class="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 transform-gpu rounded-md border-0 transition-transform hover:scale-[1.1]" {href}>
	<slot></slot>
</svelte:element>
