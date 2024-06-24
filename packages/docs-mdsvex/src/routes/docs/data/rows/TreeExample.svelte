<script>
	import { time } from '$lib';
	import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt/svelte';
</script>

<div class="example border my-12">
	<div class="text-center border-b">Click on row headers to expand and collapse.</div>
	<SvelteGantt
		from={time('8:00')}
		to={time('12:00')}
		tableHeaders={[{ title: 'Title', property: 'label', type: 'tree' }]}
		rows={[
			{
				id: 1,
				label: 'Parent 1',
				expanded: false,
				children: [
					{ id: 11, label: 'Child 1' },
					{ id: 12, label: 'Child 2' }
				]
			},
			{
				id: 2,
				label: 'Parent 2',
				expanded: true,
				children: [
					{ id: 21, label: 'Child 1', children: [{ id: 211, label: 'Grandchild 1' }] },
					{ id: 22, label: 'Child 2' },
					{ id: 23, label: 'Child 3' }
				]
			},
			{ id: 3, label: 'No children' }
		]}
		ganttTableModules={[SvelteGanttTable]}
	/>
</div>

<style lang="postcss">
	.example :global(.sg-tree-expander .fa-angle-right::before) {
		display: block;
		content: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>');
		width: 1rem;
		height: 1rem;
	}
	.example :global(.sg-tree-expander .fa-angle-down::before) {
		display: block;
		content: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>');
		width: 1rem;
		height: 1rem;
	}
</style>
