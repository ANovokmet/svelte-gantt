<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import IconButton from './IconButton.svelte';
	import SunIcon from '$lib/icons/SunIcon.svelte';
	import MoonIcon from '$lib/icons/MoonIcon.svelte';
	import GithubIcon from '$lib/icons/GithubIcon.svelte';

	// import Popover from '$lib/components/base/Popover.svelte';

	// import ColorSchemeToggle from '$lib/components/base/ColorSchemeToggle.svelte';
	import NavLink from './NavLink.svelte';
	import MenuIcon from '$lib/icons/MenuIcon.svelte';
	import ArrowRightIcon from '$lib/icons/ArrowRightIcon.svelte';
	import { meta } from '$lib/store';
	import SvelteGanttLogo from '$lib/icons/SvelteGanttLogo.svelte';

	export let search = false;

	const dispatch = createEventDispatcher();

	function onOpenPopover() {
		dispatch('open-popover');
	}

	function onClosePopover() {
		dispatch('close-popover');
	}

	let theme = 'light';

	function onSchemeToggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

	export let isSidebarOpen = false;
	let showSidebar = true;
</script>

<div class="w-full mx-auto max-w-7xl">
	<!-- width 8xl when docs, h-18/h-32 -->
	<div class="flex items-center py-4 mx-4 border-b lg:border-0 border-slate-900/10 h-20">
		<div class="logo">
			<Button href="/">
				<span class="flex items-center">
					<SvelteGanttLogo class="inline-block size-6 mr-1" /> svelte-gantt
				</span>
			</Button>
		</div>

		<div class="flex-1"></div>

		<div class="lg:flex items-center hidden">
			<nav>
				<ul class="flex items-center space-x-8">
					<NavLink href={'/docs'} title="Documentation" />
				</ul>
			</nav>

			<div class="hidden lg:flex items-center ml-6">
				<IconButton href="https://github.com/ANovokmet/svelte-gantt">
					<GithubIcon />
				</IconButton>
				<IconButton on:click={onSchemeToggle}>
					{#if theme === 'light'}
						<SunIcon />
					{:else}
						<MoonIcon />
					{/if}
				</IconButton>
			</div>
		</div>
	</div>

	<div class="nav-category border-border lg:hidden flex w-full items-center p-4 h-12">
		<button
			id="main-sidebar-button"
			type="button"
			class="text-soft hover:text-inverse inline-flex justify-center rounded-md text-sm font-medium"
			aria-controls="main-sidebar"
			aria-expanded={isSidebarOpen ? 'true' : 'false'}
			aria-haspopup="true"
			on:click={() => dispatch('open')}
		>
			<MenuIcon />
		</button>

		<ol class={`text-md text-soft flex items-center whitespace-nowrap leading-6 ${showSidebar ? 'mt-px ml-2.5' : 'mt-2'}`}>
			<li class="flex items-center">{$meta.category?.title} <ArrowRightIcon class="size-4 mx-1" /></li>
			<li class="truncate font-semibold text-slate-900 dark:text-slate-200">{$meta.page?.label}</li>
		</ol>
	</div>
</div>
