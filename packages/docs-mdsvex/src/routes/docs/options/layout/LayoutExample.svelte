<script>
	import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt/svelte';
	import { defaultOptions, time } from '$lib';

	let layout = 'overlap';
	const values = ['overlap', 'pack', 'expand'];
</script>

<div class="border">
	<div class="flex gap-2 justify-center border-b p-2">
		<span><code>layout</code>:</span>
		{#each values as value}
			<span>
				<input id={value} type="radio" bind:group={layout} {value} />
				<label for={value}><code>'{value}'</code> </label>
			</span>
		{/each}
	</div>

	<div class="example">
		<SvelteGantt
			from={time('8:00')}
			to={time('14:00')}
			{layout}
			rows={[
				{ id: 1, label: 'Resource #1' },
				{ id: 2, label: 'Resource #2' },
				{ id: 3, label: 'Resource #3' },
				{ id: 4, label: 'Resource #4' }
			]}
			tasks={[
				{ id: 1, resourceId: 1, from: time('8:00'), to: time('10:00'), label: 'Default', classes: 'blue' },
				{ id: 2, resourceId: 1, from: time('9:00'), to: time('11:00'), label: 'Default', classes: 'orange' },
				{ id: 3, resourceId: 1, from: time('9:30'), to: time('12:00'), label: 'Default', classes: 'violet' },
				{ id: 4, resourceId: 2, from: time('9:00'), to: time('11:00'), label: 'Default', classes: 'blue' },
				{ id: 5, resourceId: 2, from: time('9:30'), to: time('11:00'), label: 'Default', classes: 'orange' },
				{ id: 6, resourceId: 2, from: time('11:00'), to: time('13:00'), label: 'Default', classes: 'violet' },
				{ id: 7, resourceId: 3, from: time('9:00'), to: time('11:00'), label: 'Default', classes: 'blue' }
			]}
			ganttTableModules={[SvelteGanttTable]}
		/>
	</div>
</div>

<style lang="postcss">
	.example :global(.blue) {
		@apply bg-blue-400;
	}
	.example :global(.orange) {
		@apply bg-orange-400;
	}
	.example :global(.violet) {
		@apply bg-violet-400;
	}
</style>
