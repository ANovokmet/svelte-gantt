<script>
	import { time } from '$lib';
	import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt/svelte';
</script>

<div class="example border my-12">
	<SvelteGantt from={time('8:00')} to={time('14:00')}
		minWidth={200}
		fitWidth={true}
		rows={[
			{id: 1, label: 'Row 1'}, 
			{id: 2, label: 'Row 2'}, 
			{id: 3, label: 'Row 3'}, 
			{id: 4, label: 'Row 4'}, 
			{id: 5, label: 'Row 4'}, 
			{id: 6, label: 'Row 4'}, 
		]}
		tasks={[
			{ id: 1, resourceId: 1, from: time('8:30'), to: time('10:00'), label: 'Default' },
			{ id: 2, resourceId: 2, from: time('9:00'), to: time('10:30'), label: '25% done', amountDone: 25 },
			{ id: 3, resourceId: 3, from: time('9:30'), to: time('11:00'), label: 'Custom class', classes: 'gradient' },
			{ id: 4, resourceId: 4, from: time('10:00'), to: time('11:30'), html: '<span class="flex items-center gap-2"><span class="w-4 h-4 bg-blue-800"></span>Html content</span>' },
			{ id: 5, resourceId: 5, from: time('10:30'), to: time('12:00'), label: 'Resizable but not draggable', enableDragging: false },
			{ id: 6, resourceId: 6, from: time('11:00'), to: time('12:30'), label: 'Draggable but not resizable', enableResize: false }
		]}
	/>
</div>

<style lang="postcss">
    .example :global(.gradient) {
        @apply bg-gradient-to-tr from-pink-500 to-violet-500 rounded-md;
    }
    .example :global(.gradient:hover) {
        @apply bg-gradient-to-tr from-pink-600 to-violet-600 rounded-md shadow-xl;
    }
</style>