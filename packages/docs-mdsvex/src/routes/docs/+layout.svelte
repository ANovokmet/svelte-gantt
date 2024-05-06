<script>
	import Navbar from '$lib/components/NavBar.svelte';
	import Sidebar from '$lib/components/SideBar.svelte';

	import Button from '$lib/components/Button.svelte';

	export let isSidebarOpen = false;
	export let isNavPopoverOpen = false;

	export let search = false;

  let navbar = true;
  let showSidebar = true;
  let showBottomNav = true;
  let collapseNavbar = false;
</script>


		{#if showSidebar}
			<Sidebar
				{search}
				class={({ open }) =>
					clsx(
						'self-start fixed top-0 left-0 transform bg-body z-50 border-border border-r scrollbar',
						'-translate-x-full transform transition-transform duration-200 ease-out will-change-transform',
						'max-h-screen min-h-screen min-w-[var(--kd-sidebar-min-width)] max-w-[var(--kd-sidebar-max-width)]',
						'992:translate-x-0 922:block 992:sticky 992:z-0 overflow-y-auto p-[var(--kd-sidebar-padding)]',
						open && 'translate-x-0',
						navbar
							? '992:top-[var(--kd--navbar-height)] 992:min-h-[calc(100vh-var(--kd--navbar-height))] 992:max-h-[calc(100vh-var(--kd--navbar-height))]'
							: '992:top-0 min-h-screen max-h-screen'
					)}
				open={isSidebarOpen}
			>
				<svelte:fragment slot="top">
					<slot name="sidebar-top" />
				</svelte:fragment>
				<svelte:fragment slot="bottom">
					<slot name="sidebar-bottom" />
				</svelte:fragment>
				<svelte:fragment slot="search">
					<slot name="search" />
				</svelte:fragment>
			</Sidebar>
		{/if}

		<main
			class={`
      w-full overflow-x-hidden
      ${navbar ? `992:min-h-[calc(100vh-var(--kd--navbar-height))]` : 'min-h-screen'}
      ${navbar && 'min-h-[calc(100vh-var(--kd--navbar-height))]'}
      ${showSidebar ? 'px-8 992:px-16' : 'px-6'}
      ${navbar || showBottomNav ? 'pt-8' : ''}
      `}
			style={`max-width: var(--kd-main-max-width, var(--kd-article-max-width));`}
		>
			<slot name="main-top" />

      
      <article class="markdown prose dark:prose-invert z-10 max-w-[var(--kd-article-max-width)]">
        <p class="text-brand mb-3.5 text-[15px] font-semibold leading-6">
          Active category
        </p>

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

		<div class="992:flex-1" />