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
</script>

<div
	class="flex w-full flex-col items-center justify-center mx-auto max-w-[var(--kd-navbar-max-width)] p-[var(--kd-navbar-padding)] h-[var(--kd--navbar-height)]"
>
	<div class={'flex w-full items-center'}>
		<!-- <slot name="left" /> -->
		<div class="logo">
			<Button href="/">svelte-gantt</Button>
		</div>

		<div class="flex-1"></div>

		<div class="992:flex 992:items-center hidden">
			<nav>
				<ul class="flex items-center space-x-8">
					<NavLink href={'/docs'} title="Documentation" />
				</ul>
			</nav>

			<slot name="right" />

			<div class="hidden 992:flex items-center ml-6">
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

	<slot name="bottom" />
</div>
