<script>
	import '../app.css';
	import 'prism-themes/themes/prism-lucario.css';
  import '$lib/styles/normalize.css';
  import '$lib/styles/fonts.css';
  import '$lib/styles/theme.css';
  import '$lib/styles/vars.css';

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

<div
	class="kit-docs bg-body text-inverse min-h-full min-w-full h-full transition-transform duration-150 ease-out"
	style={`
  font-family: var(--kd-font-family-sans, inherit);
  --kd-breadcrumbs-height: 0px;
  --kd--navbar-height: calc(var(--kd-navbar-height) + var(--kd-breadcrumbs-height));
  `}
>
	{#if navbar}
		<div
			class={`
      fixed top-0 z-30 w-full flex-none transform-gpu transition-transform duration-150 ease-out
      ${isNavPopoverOpen ? '' : 'blur-bg'}
      ${collapseNavbar
					? '-translate-y-[calc(calc(var(--kd--navbar-height)-var(--kd-breadcrumbs-height))+1px)]'
					: 'translate-y-0'}
      `}
			style="border-bottom: var(--kd-navbar-border-bottom);"
		>
			<Navbar
				{search}
				on:open-popover={() => {
					isNavPopoverOpen = true;
				}}
				on:close-popover={() => {
					isNavPopoverOpen = false;
				}}
			>
				<svelte:fragment slot="search">
					<slot name="search" />
				</svelte:fragment>
				<svelte:fragment slot="left">
					<slot name="navbar-left" />
				</svelte:fragment>
				<svelte:fragment slot="right">
					<slot name="navbar-right" />
				</svelte:fragment>
				<svelte:fragment slot="right-alt">
					<slot name="navbar-right-alt" />
				</svelte:fragment>

				<svelte:fragment slot="bottom">
					{#if showBottomNav}
						<div class="border-border 992:hidden flex w-full items-center mt-4 pt-4 border-t">
							{#if showSidebar}
								<button
									id="main-sidebar-button"
									type="button"
									class="text-soft hover:text-inverse inline-flex justify-center rounded-md p-2 text-sm font-medium"
									aria-controls="main-sidebar"
									aria-expanded={isSidebarOpen ? 'true' : 'false'}
									aria-haspopup="true"
								>
                  TTT
								</button>
							{/if}

              <ol
              class={`
              text-md text-soft flex items-center whitespace-nowrap leading-6
              ${showSidebar ? 'mt-px ml-2.5' : 'mt-2'}
              `}
            >
                <li class="flex items-center">
                  Active category
                  -&lt;
                </li>
              <li class="truncate font-semibold text-slate-900 dark:text-slate-200">
                Active link title
              </li>
            </ol>
						</div>
					{/if}

					<slot name="navbar-bottom" />
				</svelte:fragment>

				<svelte:fragment slot="popover-top">
					<slot name="navbar-popover-top" />
				</svelte:fragment>
				<svelte:fragment slot="popover-middle">
					<slot name="navbar-popover-middle" />
				</svelte:fragment>
				<svelte:fragment slot="popover-options">
					<slot name="navbar-popover-options" />
				</svelte:fragment>
				<svelte:fragment slot="popover-bottom">
					<slot name="navbar-popover-bottom" />
				</svelte:fragment>
			</Navbar>
		</div>
	{/if}

	<div
		class={`mx-auto w-full flex flex-row min-h-full max-w-[var(--kd-content-max-width)] ${'pt-[var(--kd--navbar-height)] z-20'}`}
	>
    <slot />

<!-- 
		<OnThisPage
			class={clsx(
				'pt-8 pb-8 hidden overflow-auto min-w-[160px] sticky right-4 pr-4 1440:right-6 1440:pr-2 1280:block pl-0.5',
				navbar
					? 'top-[var(--kd--navbar-height)] max-h-[calc(100vh-var(--kd--navbar-height))]'
					: 'top-0 max-h-screen'
			)}
		/> -->
	</div>
</div>
