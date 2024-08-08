<script>
	import Sidebar from '$lib/components/SideBar.svelte';
	import Button from '$lib/components/Button.svelte';
	import { base } from '$app/paths';

	import { isSidebarOpen, meta, nextPage, previousPage } from '$lib/store';
</script>

<div class="mx-auto w-full flex flex-row min-h-full max-w-7xl pt-32 lg:pt-20 z-20">
	<Sidebar open={$isSidebarOpen} on:close={() => ($isSidebarOpen = false)}></Sidebar>

	<!-- overlay -->
	<div class="lg:hidden z-40">
		<div
			class="pointer-events-auto fixed top-0 left-0 z-40 backdrop-blur-sm backdrop-filter transition-opacity duration-75 bg-body/20 dark:bg-body/60 h-screen w-screen {$isSidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}"
			on:click={() => ($isSidebarOpen = false)}
		></div>
	</div>

	<main class={`w-full overflow-x-hidden lg:min-h-64 min-h-[calc(100vh-var(--sg--navbar-height))] px-8 992:px-16 pt-8`}>

		<article class="markdown prose dark:prose-invert z-10 max-w-[var(--sg-article-max-width)]">
			<p class="text-brand mb-3.5 text-[15px] font-semibold leading-6">{$meta.category?.title}</p>

			<slot />
		</article>

		{#if $previousPage || $nextPage}
			<hr class="border-border mt-20" />

			<div class="992:text-xl flex items-center pt-12 pb-20 text-lg font-semibold text-gray-300">
				{#if $previousPage}
					<div class="mb-4 flex flex-col items-start">
						<span class="text-inverse ml-3 mb-4 inline-block">Previous</span>
						<Button arrow="left" href={base}{$previousPage.href} class="hover:text-inverse" data-sveltekit-prefetch>
							{$previousPage.label}
						</Button>
					</div>
				{/if}

				{#if $nextPage}
					<div class="ml-auto mb-4 flex flex-col items-end">
						<span class="text-inverse mr-3 mb-4 inline-block">Next</span>
						<Button arrow="right" href={base}{$nextPage.href} class="hover:text-inverse" data-sveltekit-prefetch>
							{$nextPage.label}
						</Button>
					</div>
				{/if}
			</div>
		{/if}

		<footer class="flex text-center py-20 border-t text-slate-500">
			<div class="">
				@2024 Ante Novokmet - <a href="https://github.com/ANovokmet/">ANovokmet</a>
			</div>
			<div class="ml-auto">
				Need more features? <a href="https://github.com/ANovokmet" class="text-base font-base hover:underline hover:text-brand">Contact</a>
			</div>
		</footer>
	</main>
</div>
