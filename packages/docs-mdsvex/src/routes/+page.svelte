<script>
	import { SvelteGantt, SvelteGanttDependencies, SvelteGanttTable } from 'svelte-gantt/svelte';
	import { defaultOptions, time } from '$lib';
	import { onDestroy, onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import FeatureCard from './FeatureCard.svelte';

	let expansionObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			entry.target.classList.remove('opacity-0', 'translate-y-2');
			entry.target.classList.add('opacity-100', 'translate-y-0');
		});
	});

	onMount(() => {
		document.body.classList.add('landing-page');
		document.querySelectorAll('.loading').forEach((e) => expansionObserver.observe(e));
	});

	onDestroy(() => {
		document.body.classList.remove('landing-page');
	});
</script>

<main class="overflow-hidden flex flex-col min-h-screen">
	<header class="relative">
		<div class="px-4 sm:px-6 md:px-8 pt-12">
			<div class="absolute inset-0 bottom-10 bg-bottom bg-no-repeat bg-slate-200">
				<div class="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom dark:border-b dark:border-slate-100/5"></div>
			</div>
			<div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32">
				<h1 class="text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
					Lightweight and fast interactive <span class="bg-clip-text text-transparent bg-gradient-to-tr from-pink-500 to-violet-500">Gantt chart.</span>
				</h1>
				<p class="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto dark:text-slate-400">
					<span class="font-medium bg-clip-text text-transparent bg-gradient-to-tr from-pink-500 to-violet-500">Svelte-gantt</span> is a lightweight and fast interactive gantt chart/resource booking component
					made with Svelte. Compatible with React, Angular, Vue, Svelte... Zero dependencies.
				</p>

				<div class="mt-6 sm:mt-10 flex justify-center space-x-6 text-sm">
					<a
						class="group text-white font-medium text-2xl transition-all hover:scale-105 px-6 py-3 text-soft mb-12 bg-gradient-to-tr from-pink-500 to-violet-500 hover:bg-violet-600 mx-auto transition-all"
						href="/docs/getting-started/installation"
					>
						<span class="inline-block transform transition-transform duration-100 group-hover:translate-x-0">Get started</span>
					</a>
				</div>
			</div>
		</div>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-20 sm:mt-24 lg:mt-32">
			<div class="-mx-4 sm:mx-0">
				<div
					class="relative overflow-hidden shadow-xl flex bg-white max-h-[60vh] sm:rounded-xl lg:h-[34.6875rem] xl:h-[31.625rem] dark:bg-slate-900/70 dark:backdrop-blur dark:ring-1 dark:ring-inset dark:ring-white/10 !h-auto max-h-[none]"
				>
					<SvelteGantt
						from={time('8:00')}
						to={time('16:00')}
                        fitWidth={true}
						ganttTableModules={[SvelteGanttTable]}
                        ganttBodyModules={[SvelteGanttDependencies]}
						rows={[
							{ id: 1, label: 'Jedd Balden' },
							{ id: 2, label: 'Rozele McFarland' },
							{ id: 3, label: 'Chrissy Bullard' },
							{ id: 4, label: 'Patience Leschelle' },
							{ id: 5, label: 'Rosette Henrie' }
						]}
                        dependencies={[{
                            id: 1,
                            fromId: 2,
                            toId: 3,
                            stroke: '#64748b',
                        }]}
						tasks={[
							{ id: 1, resourceId: 1, from: time('9:00'), to: time('10:00'), label: 'Development', classes: 'task-slate' },
							{ id: 2, resourceId: 4, from: time('8:30'), to: time('10:30'), label: 'Design', classes: 'task-blue' },
							{ id: 3, resourceId: 5, from: time('12:30'), to: time('14:30'), label: 'Review', classes: 'task-blue' }
						]}
						timeRanges={[
							{
								id: 0,
								from: time('10:00'),
								to: time('11:00'),
								classes: 'time-range-lunch',
								label: 'Lunch',
								resizable: false
							}
						]}
					/>
				</div>
			</div>
		</div>
	</header>

	<section class="grow">
		<div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 mb-20 sm:mb-24 lg:mb-32 px-4 sm:px-6 md:px-8 lg:px-0">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<FeatureCard>
					<svelte:fragment slot="title">Interactive</svelte:fragment>
					<svelte:fragment slot="subtitle">Items can be added, moved and resized. Select multiple to move them at once.</svelte:fragment>
				</FeatureCard>
				<FeatureCard>
					<svelte:fragment slot="title">Fast</svelte:fragment>
					<svelte:fragment slot="subtitle">Display thousands of tasks assigned to thousands of resources. Update them in real-time.</svelte:fragment>
				</FeatureCard>
				<FeatureCard>
					<svelte:fragment slot="title">Zoom</svelte:fragment>
					<svelte:fragment slot="subtitle">Zoom the chart in or out. Display different periods of time.</svelte:fragment>
				</FeatureCard>
				<FeatureCard>
					<svelte:fragment slot="title">Layouts</svelte:fragment>
					<svelte:fragment slot="subtitle">Display tasks overlapped or spaced apart.</svelte:fragment>
				</FeatureCard>
                <!-- TODO:: need more features? contact me -->
			</div>
		</div>
	</section>

	<footer class="h-40 bg-slate-400 flex items-center justify-center">
		<div class="relative max-w-5xl mx-auto">
			<div class="text-slate-100">
				@2024 Ante Novokmet - <a href="https://github.com/ANovokmet/">ANovokmet</a>
			</div>
		</div>
	</footer>
</main>

<style lang="postcss">
	:global(.sg-task.task-slate) {
		@apply bg-slate-500;
	}

	:global(.sg-task.task-slate:hover) {
		@apply bg-slate-700;
	}

	:global(.sg-task.task-blue) {
		@apply bg-blue-500;
	}

	:global(.sg-task.task-blue:hover) {
		@apply bg-blue-700;
	}
</style>
