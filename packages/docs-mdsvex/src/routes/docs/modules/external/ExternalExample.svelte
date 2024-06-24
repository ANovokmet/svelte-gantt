<script>
	import { SvelteGantt, SvelteGanttTable, SvelteGanttExternal } from 'svelte-gantt/svelte';
	import { defaultOptions, time } from '$lib';
	import { onMount } from 'svelte';

	let element;
	let gantt;
	let tasks = [];

	onMount(() => {
		new SvelteGanttExternal(element, {
			gantt,
			onsuccess: (row, date, gantt) => {
				console.log('success');
				tasks = [...tasks, {
					id: tasks.length,
					resourceId: row.model.id,
					label: 'New task',
					from: date,
					to: date + 60 * 60 * 1000,
				}];
			},
			onfail: () => {

			},
		})
	});

	// TODO:: make external accept any gantt implicitly
</script>

<div class="border">
	<div class="flex p-2 border-b">
		<div class="px-2 border bg-slate-100 select-none" bind:this={element}>
			Drag to gantt
		</div>
	</div>

	<SvelteGantt
		bind:this={gantt}
		from={time('8:00')}
		to={time('14:00')}
		tasks={tasks}
		rows={[
			{ id: 1, label: 'Resource #1' },
			{ id: 2, label: 'Resource #2' },
			{ id: 3, label: 'Resource #3' },
			{ id: 4, label: 'Resource #4' }
		]}
		ganttTableModules={[SvelteGanttTable]}
	/>
</div>
