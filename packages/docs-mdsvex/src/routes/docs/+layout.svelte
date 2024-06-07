<script>
	import Navbar from '$lib/components/NavBar.svelte';
	import Sidebar from '$lib/components/SideBar.svelte';

	import Button from '$lib/components/Button.svelte';

	import { isSidebarOpen } from '$lib/store';
	export let isNavPopoverOpen = false;

	export let search = false;
</script>

<div class="mx-auto w-full flex flex-row min-h-full max-w-7xl pt-24 lg:pt-20 z-20">
	<Sidebar
		{search}
		open={$isSidebarOpen}
		on:close={() => ($isSidebarOpen = false)}
	></Sidebar>

	<!-- overlay -->
	<div class="lg:hidden z-40">
		<div
			class={`pointer-events-auto fixed top-0 left-0 z-40 backdrop-blur-sm backdrop-filter transition-opacity duration-75 bg-body/20 dark:bg-body/60 h-screen w-screen ${$isSidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
			on:click={() => ($isSidebarOpen = false)}
		></div>
	</div>

	<main class={`w-full overflow-x-hidden lg:min-h-64 min-h-[calc(100vh-var(--kd--navbar-height))] px-8 992:px-16 pt-8`}>
		<slot name="main-top" />

		<article class="markdown prose dark:prose-invert z-10 max-w-[var(--kd-article-max-width)]">
			<p class="text-brand mb-3.5 text-[15px] font-semibold leading-6">Active category</p>

			<slot />
		</article>

		<!-- {#if $previousLink || $nextLink}
				<hr class="border-border mt-20" />

				<div class="992:text-xl flex items-center pt-12 pb-20 text-lg font-semibold text-gray-300">
					{#if $previousLink}
						<div class="mb-4 flex flex-col items-start">
							<span class="text-inverse ml-3 mb-4 inline-block">{$i18nContext.nav.previous}</span>
							<Button
								arrow="left"
								href={$previousLink.slug}
								class="hover:text-inverse"
								data-sveltekit-prefetch
							>
								{$previousLink.title}
							</Button>
						</div>
					{/if}

					{#if $nextLink}
						<div class="ml-auto mb-4 flex flex-col items-end">
							<span class="text-inverse mr-3 mb-4 inline-block">{$i18nContext.nav.next}</span>
							<Button
								arrow="right"
								href={$nextLink.slug}
								class="hover:text-inverse"
								data-sveltekit-prefetch
							>
								{$nextLink.title}
							</Button>
						</div>
					{/if}
				</div>
			{/if} -->

		<slot name="main-bottom" />
	</main>
</div>
