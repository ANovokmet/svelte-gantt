<script>
	import '../app.css';
	import 'prism-themes/themes/prism-lucario.css';
	import '$lib/styles/normalize.css';
	import '$lib/styles/fonts.css';
	import '$lib/styles/theme.css';
	import '$lib/styles/vars.css';

	import Navbar from '$lib/components/NavBar.svelte';
	import Sidebar from '$lib/components/SideBar.svelte';
	import { isSidebarOpen } from '$lib/store';

	import Button from '$lib/components/Button.svelte';
	import ArrowRightIcon from '$lib/icons/ArrowRightIcon.svelte';
	import MenuIcon from '$lib/icons/MenuIcon.svelte';

	export let isNavPopoverOpen = false;

	export let search = false;

	let navbar = true;
	let showSidebar = true;
	let showBottomNav = true;
	let collapseNavbar = false;
</script>

<div class="kit-docs bg-body text-inverse min-h-full min-w-full h-full transition-transform duration-150 ease-out">
	<div
		class={`fixed top-0 z-30 w-full flex-none transform-gpu transition-transform duration-150 ease-out ${isNavPopoverOpen ? '' : 'blur-bg'} ${collapseNavbar ? '-translate-y-[calc(calc(var(--kd--navbar-height)-var(--kd-breadcrumbs-height))+1px)]' : 'translate-y-0'}  border-b border-slate-900/10`}
	>
		<Navbar
			{search}
			on:open-popover={() => {
				isNavPopoverOpen = true;
			}}
			on:close-popover={() => {
				isNavPopoverOpen = false;
			}}
			on:open={() => $isSidebarOpen = true}
		></Navbar>
	</div>

	<slot />
</div>
