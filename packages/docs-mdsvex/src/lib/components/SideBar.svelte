<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import SideBarLink from './SideBarLink.svelte';
	import SideBarCategory from './SideBarCategory.svelte';

	const dispatch = createEventDispatcher();

	let sidebar: HTMLElement;

	// Only valid on small screen (<992px).
	export let open = false;
	export let search = false;

	let _class: string | ((state: { open: boolean }) => string) = '';
	export { _class as class };

	export let style = '';
</script>

<aside id="main-sidebar" class="sidebar sidebar self-start fixed top-0 left-0 transform bg-body z-50 border-border border-r scrollbar -translate-x-full transform transition-transform duration-200 ease-out will-change-transform max-h-screen min-h-screen min-w-[var(--kd-sidebar-min-width)] max-w-[var(--kd-sidebar-max-width)] 992:translate-x-0 922:block 992:sticky 992:z-0 overflow-y-auto p-[var(--kd-sidebar-padding)] 992:top-[var(--kd--navbar-height)] 992:min-h-[calc(100vh-var(--kd--navbar-height))] 992:max-h-[calc(100vh-var(--kd--navbar-height))]" bind:this={sidebar} {style}>
	<div class="992:hidden sticky top-0 left-0 flex items-center">
		<div class="flex-1" />
		<button
			class={`text-soft hover:text-inverse p-4 -mx-6`}
			on:pointerdown={() => dispatch('close')}
		>
			x
			<span class="sr-only">Close sidebar</span>
		</button>
	</div>

	<nav class="992:px-1 scrollbar">
		{#if search}
			<div class="pointer-events-none sticky top-0 z-0 -ml-0.5 min-h-[80px]">
				<div class="992:h-6 bg-body" />
				<div class="bg-body pointer-events-auto relative">
					<div class="992:block hidden">
						<slot name="search" />
					</div>
				</div>
				<div class="from-body h-8 bg-gradient-to-b" />
			</div>
		{/if}

		<slot name="top" />

		<ul class="mt-8 pb-28 992:pb-0">
      <SideBarCategory title="Getting started">
        <SideBarLink href="/docs/getting-started/installation" label="Installation" />
        <SideBarLink href="/docs/getting-started/migrating" label="Migrating" />
      </SideBarCategory>
      <SideBarCategory title="Data">
        <SideBarLink href="/docs/data/rows" label="Rows" />
        <SideBarLink href="/docs/data/tasks" label="Tasks" />
        <SideBarLink href="/docs/data/time-ranges" label="Time ranges" />
      </SideBarCategory>
      <SideBarCategory title="Options">
        <SideBarLink href="/docs/options/gantt" label="Gantt" />
        <SideBarLink href="/docs/options/columns" label="Columns" />
        <SideBarLink href="/docs/options/headers" label="Headers" />
        <SideBarLink href="/docs/options/zoom" label="Zoom" />
      </SideBarCategory>
      <SideBarCategory title="Modules">
        <SideBarLink href="/docs/modules/dependencies" label="Dependencies" />
        <SideBarLink href="/docs/modules/table" label="Table" />
        <SideBarLink href="/docs/modules/external" label="External" />
        <SideBarLink href="/docs/modules/create-tasks" label="Create tasks" />
      </SideBarCategory>
		</ul>

		<slot name="bottom" />
	</nav>
</aside>
