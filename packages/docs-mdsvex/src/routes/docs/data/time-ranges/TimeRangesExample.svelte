<script>
	import { time } from '$lib';
	import { SvelteGantt } from 'svelte-gantt/svelte';
</script>

<div class="example border my-12">
	<SvelteGantt
		from={time('8:00')}
		to={time('14:00')}
		minWidth={400}
		fitWidth={true}
		rows={[{ id: 1 }, { id: 2 }]}
		timeRanges={[
			{
				id: 1,
				from: time('8:00'),
				to: time('9:00'),
				classes: null,
				label: 'Breakfast'
			},
			{
				id: 0,
				from: time('10:00'),
				to: time('11:00'),
				classes: 'time-range-lunch',
				label: 'Lunch',
				resizable: false
			},
			{
				id: 2,
				from: time('12:00'),
				to: time('13:00'),
				label: 'Custom class',
				classes: 'gradient'
			}
		]}
	/>
</div>

<style lang="postcss">
	.example :global(.gradient) {
		@apply bg-gradient-to-tr from-pink-500 to-violet-500 rounded-md;
		background-size: unset !important;
	}
	.example :global(.gradient:hover) {
		@apply bg-gradient-to-tr from-pink-600 to-violet-600 rounded-md shadow-xl;
	}
</style>
