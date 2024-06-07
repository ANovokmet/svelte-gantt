<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SideBarLink from './SideBarLink.svelte';
	import SideBarCategory from './SideBarCategory.svelte';
	import CloseIcon from '../icons/CloseIcon.svelte';
	import { pages } from '$lib/store';

	const dispatch = createEventDispatcher();

	export let open = false;
</script>

<aside
	id="main-sidebar"
	class="sidebar fixed top-0 lg:top-20 left-0 transform bg-body z-50 border-border border-r scrollbar transform transition-transform
	duration-200 ease-out will-change-transform max-h-screen min-h-screen min-w-60 lg:translate-x-0 lg:block lg:sticky
	lg:z-0 overflow-y-auto px-6 md:px-6 lg:px-4 {open ? 'translate-x-0' : '-translate-x-full'}"
>
	<div class="lg:hidden sticky top-0 left-0 flex items-center">
		<div class="flex-1" />
		<button class={`text-soft hover:text-inverse p-4 -mx-6`} on:pointerdown={() => dispatch('close')}>
			<CloseIcon />
			<span class="sr-only">Close sidebar</span>
		</button>
	</div>

	<nav class="lg:px-1 scrollbar">
		<ul class="mt-8 lg:pb-0">
			{#each pages as category}
				<SideBarCategory title={category.title}>
					{#each category.pages as page}
						<SideBarLink href={page.href} label={page.label} />
					{/each}
				</SideBarCategory>
			{/each}
		</ul>
	</nav>
</aside>
