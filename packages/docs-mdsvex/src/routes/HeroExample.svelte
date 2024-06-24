<script>
	import { SvelteGantt, SvelteGanttTable, SvelteGanttDependencies } from 'svelte-gantt/svelte';
	import { time } from '$lib';

    let tasks = [
		{ id: 1, resourceId: 1, from: time('9:00'), to: time('10:00'), label: 'Site visit', classes: 'task-slate' },
		{ id: 2, resourceId: 3, from: time('9:00'), to: time('12:15'), label: 'Development', classes: 'task-slate', enableDragging: false, enableResize: false },
		{ id: 3, resourceId: 4, from: time('8:30'), to: time('10:30'), label: 'Design', classes: 'task-blue' },
		{ id: 4, resourceId: 5, from: time('12:30'), to: time('14:30'), label: 'Review', classes: 'task-blue' },
		{ id: 5, resourceId: 2, from: time('12:30'), to: time('15:00'), label: 'Review', classes: 'task-pink' }
	];

    let numUpdate = 0;
    const updates = [
		{ resourceId: 1, from: time('9:00'), to: time('10:00'), classes: 'task-blue' },
		{ resourceId: 2, from: time('8:30'), to: time('11:30'), classes: 'task-pink' },
		{ resourceId: 3, from: time('12:30'), to: time('14:30'), classes: 'task-blue' }
    ];
    setInterval(() => {
        numUpdate++;
    }, 2000);

    $: {
        const update = updates[numUpdate % updates.length];
        Object.assign(tasks[0], update);
        tasks = tasks;
    }
</script>

<div class="example w-full">
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
        dependencies={[
            {
                id: 1,
                fromId: 3,
                toId: 4,
                stroke: '#64748b'
            }
        ]}
        tasks={tasks}
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

<style lang="postcss">
	.example :global(.task-pink) {
		@apply bg-pink-600 text-white;
	}

	.example :global(.task-pink:hover) {
		@apply bg-pink-800;
	}

	.example :global(.task-slate) {
		@apply bg-slate-400 text-white;
	}

	.example :global(.task-slate:hover) {
		@apply bg-slate-600;
	}

	.example :global(.task-blue) {
		@apply bg-blue-500 text-white;
	}

	.example :global(.task-blue:hover) {
		@apply bg-blue-600;
	}
</style>