<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import SideBarLink from './SideBarLink.svelte';
	import SideBarCategory from './SideBarCategory.svelte';
	import CloseIcon from '../icons/CloseIcon.svelte';

	const dispatch = createEventDispatcher();

	let sidebar: HTMLElement;

	// Only valid on small screen (<992px).
	export let open = false;
	export let search = false;

	let _class: string | ((state: { open: boolean }) => string) = '';
	export { _class as class };

	export let style = '';
</script>

<aside
	id="main-sidebar"
	class={`sidebar fixed top-0 left-0 transform bg-body z-50 border-border border-r scrollbar transform transition-transform duration-200 ease-out will-change-transform max-h-screen min-h-screen min-w-[var(--kd-sidebar-min-width)] max-w-[var(--kd-sidebar-max-width)] lg:translate-x-0 lg:block lg:sticky lg:z-0 overflow-y-auto p-[var(--kd-sidebar-padding)] 
	
	lg:min-h-[calc(100vh-var(--kd--navbar-height))] lg:max-h-[calc(100vh-var(--kd--navbar-height))]
	${open ? 'translate-x-0' : '-translate-x-full'}`}
	bind:this={sidebar}
	{style}
>
	<div class="lg:hidden sticky top-0 left-0 flex items-center">
		<div class="flex-1" />
		<button class={`text-soft hover:text-inverse p-4 -mx-6`} on:pointerdown={() => dispatch('close')}>
			<CloseIcon />
			<span class="sr-only">Close sidebar</span>
		</button>
	</div>

	<nav class="lg:px-1 scrollbar">
		{#if search}
			<div class="pointer-events-none sticky top-0 z-0 -ml-0.5 min-h-[80px]">
				<div class="lg:h-6 bg-body" />
				<div class="bg-body pointer-events-auto relative">
					<div class="lg:block hidden">
						<slot name="search" />
					</div>
				</div>
				<div class="from-body h-8 bg-gradient-to-b" />
			</div>
		{/if}

		<ul class="mt-8 pb-28 lg:pb-0">
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
				<SideBarLink href="/docs/options/layout" label="Layout" />
			</SideBarCategory>
			<SideBarCategory title="Modules">
				<SideBarLink href="/docs/modules/dependencies" label="Dependencies" />
				<SideBarLink href="/docs/modules/table" label="Table" />
				<SideBarLink href="/docs/modules/external" label="External" />
				<SideBarLink href="/docs/modules/create-tasks" label="Create tasks" />
			</SideBarCategory>
		</ul>
	</nav>
</aside>
