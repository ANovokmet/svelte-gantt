<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import { options } from '../../stores/store';

    // const colors = ['blue', 'green', 'orange'];

    let rows = [
        {
            id: 0,
            label: 'Row #1'
        },
        {
            id: 1,
            label: 'Row #2'
        },
        {
            id: 2,
            label: 'Row #3'
        },
        {
            id: 3,
            label: 'Row #4'
        },
        {
            id: 4,
            label: 'Row #5'
        },
    ];

    let tasks = [
        {
            type: 'task',
            id: 0,
            resourceId: 1,
            label: 'Task #0',
            from: time(`8:00`),
            to: time(`12:00`),
            classes: 'green'
        },
        {
            type: 'task',
            id: 1,
            resourceId: 1,
            label: 'Task #1',
            from: time(`10:00`),
            to: time(`14:00`),
            classes: 'blue'
        },
        {
            type: 'task',
            id: 2,
            resourceId: 2,
            label: 'Task #2',
            from: time(`12:00`),
            to: time(`17:00`),
            classes: 'blue'
        },
        {
            type: 'task',
            id: 3,
            resourceId: 2,
            label: 'Task #3',
            from: time(`12:00`),
            to: time(`17:00`),
            classes: 'orange'
        },
        {
            type: 'task',
            id: 4,
            resourceId: 2,
            label: 'Task #3',
            from: time(`7:00`),
            to: time(`10:00`),
            classes: 'orange'
        },
        {
            type: 'task',
            id: 5,
            resourceId: 4,
            label: 'Task #3',
            from: time(`12:00`),
            to: time(`17:00`),
            classes: 'green'
        },
    ];

    $options = {
        layout: 'pack',
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: rows,
        tasks: tasks,
        columnOffset: 15,
        magnetOffset: 15,
        rowHeight: 52,
        rowPadding: 6,
        headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
        fitWidth: true,
        minWidth: 800,
        from: time('06:00'),
        to: time('18:00'),
        tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
        tableWidth: 240,
        ganttTableModules: [SvelteGanttTable]
    }

    $: {
        console.log('options changed', $options);
        if (gantt) {
            gantt.$set($options);
        }
    }

    /**
     * @type {import('svelte-gantt').SvelteGanttComponent}
     */
    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: $options });
    });

    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign($options, opts);
        gantt.$set($options);
    }
</script>

<style>
    #example-gantt {
        flex-grow: 1;
        overflow: auto;
    }

    .container {
        display: flex;
        overflow: auto;
        flex: 1;
    }
</style>

<svelte:head>
    <title>Large dataset - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt"></div>
    <GanttOptions options={$options} on:change={onChangeOptions}/>
</div>