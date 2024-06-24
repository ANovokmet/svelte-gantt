<script>
	import '../app.css';
	import 'prism-themes/themes/prism-lucario.css';
	import '$lib/styles/normalize.css';
	import '$lib/styles/fonts.css';
	import '$lib/styles/theme.css';
	import '$lib/styles/vars.css';
	import Navbar from '$lib/components/NavBar.svelte';
	import { isSidebarOpen, meta } from '$lib/store';

	export let isNavPopoverOpen = false;

	let title = '';
	$: {
		title = $meta.page?.label ? `${$meta.page.label} | svelte-gantt` : 'svelte-gantt';
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="sg-docs bg-body text-inverse min-h-screen min-w-full transition-transform duration-150 ease-out">
	<div
		class="fixed top-0 z-30 w-full flex-none transform-gpu transition-transform duration-150 ease-out
		{isNavPopoverOpen ? '' : 'blur-bg'} 
		translate-y-0 border-b border-slate-900/10"
	>
		<Navbar on:open-popover={() => (isNavPopoverOpen = true)} on:close-popover={() => (isNavPopoverOpen = false)} on:open={() => ($isSidebarOpen = true)}></Navbar>
	</div>

	<slot />
</div>
