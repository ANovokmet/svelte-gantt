<script>
	import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt/svelte';
	import { defaultOptions, time } from '$lib';
</script>

<div class="border">
	<SvelteGantt
		from={time('8:00')}
		to={time('14:00')}
		tableHeaders={[
			{ title: 'Name', property: 'label', width: 150 },
			{ title: 'Age', property: 'age', width: 50 }
		]}
		rows={[
			{ id: 1, label: 'Resource #1', age: 50 },
			{ id: 2, label: 'Resource #2', age: 43 },
			{ id: 3, label: 'Resource #3', age: 23 },
			{ id: 4, label: 'Resource #4', age: 65 }
		]}
		ganttTableModules={[SvelteGanttTable]}
	/>
</div>
