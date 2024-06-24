<script context="module">
	export const zoomLevels = [
		{
			headers: [{ unit: 'month', format: 'MMM YYYY' }],
			minWidth: 800,
			columnUnit: 'day',
			columnOffset: 1
		},
		{
			headers: [
				{ unit: 'month', format: 'MMM YYYY' },
				{ unit: 'week', format: '[week] w' },
				{ unit: 'day', format: 'D' }
			],
			minWidth: 3200,
			columnUnit: 'hour',
			columnOffset: 4
		},
		{
			headers: [
				{ unit: 'day', format: 'MMM D, YYYY' },
				{ unit: 'hour', format: 'HH' }
			],
			minWidth: 8000,
			columnUnit: 'hour',
			columnOffset: 2
		},
		{
			headers: [
				{ unit: 'day', format: 'MMM D, YYYY' },
				{ unit: 'hour', format: 'HH' }
			],
			minWidth: 16000,
			columnUnit: 'hour',
			columnOffset: 2
		},
		{
			headers: [
				{ unit: 'day', format: 'MMM D, YYYY' },
				{ unit: 'hour', format: 'HH' }
			],
			minWidth: 32000,
			columnUnit: 'hour',
			columnOffset: 2
		}
	];
</script>

<script>
	import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt/svelte';
	import { defaultOptions, time } from '$lib';
	import moment from 'moment';

	const values = ['hour', 'day', 'week', 'month'];

	let headers = [{ unit: 'month', format: 'MMM YYYY' }];
	let minWidth = 800;
	let fitWidth = true;
	let columnUnit = 'day';
	let columnOffset = 1;
	let from = moment().startOf('month');
	let to = moment().endOf('month');

	// TODO:: zoom focus is not right? always moves to right
    // TODO:: allow click on header focus to be customized

	function applyZoom(level) {
        headers = level.headers;
        minWidth = level.minWidth;
        columnUnit = level.columnUnit;
        columnOffset = level.columnOffset;
    }
</script>

<div class="border">
	<div class="flex gap-2 justify-center border-b p-2">
		<span>Set zoom:</span>
		{#each values as value, i}
			<span>
				<button class="border hover:bg-slate-100 px-1 py-1 text-sm active:bg-slate-200" on:click={() => applyZoom(zoomLevels[i])}>{value}</button>
			</span>
		{/each}
	</div>

	<div class="example">
		<SvelteGantt
			{from}
			{to}
			rows={[
				{ id: 1, label: 'Resource #1' },
				{ id: 2, label: 'Resource #2' },
				{ id: 3, label: 'Resource #3' },
				{ id: 4, label: 'Resource #4' }
			]}
			{headers}
			{minWidth}
			{fitWidth}
			{columnUnit}
			{columnOffset}
			dateAdapter={defaultOptions.dateAdapter}
			{zoomLevels}
			tasks={[
				{ id: 1, resourceId: 1, from: time('8:00'), to: time('16:00'), label: 'Default', classes: 'blue' },
				{ id: 4, resourceId: 2, from: time('9:00'), to: time('17:00'), label: 'Default', classes: 'orange' },
				{ id: 7, resourceId: 3, from: time('10:00'), to: time('18:00'), label: 'Default', classes: 'blue' }
			]}
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
