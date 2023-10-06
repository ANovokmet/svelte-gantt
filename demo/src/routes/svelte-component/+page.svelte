<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt/svelte';
    import { onMount } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import { options } from '../../stores/store';

    let generation = 0;
    let rowCount = 100;
    const colors = ['blue', 'green', 'orange']

    const timeRanges = [
        {
            id: 0,
            from: time('10:00'),
            to: time('12:00'),
            classes: null,
            label: 'Lunch'
        },
        {
            id: 1,
            from: time('15:00'),
            to: time('17:00'),
            classes: null,
            label: 'Dinner'
        }
    ];

    const data = {
        rows: [{
            id: 1,
            label: "Preparation and Planning"
        }, {
            id: 2,
            label: "Development"
        }, {
            id: 3,
            label: "Implementation"
        }, {
            id: 4,
            label: "Training"
        }],
        tasks: [{
            id: 1,
            resourceId: 1,
            label: "Svelte-gantt",
            from: time("7:00"),
            to: time("9:00"),
            classes: "orange"
        }, {
            id: 2,
            resourceId: 2,
            label: "As a",
            from: time("9:00"),
            to: time("11:00"),
            classes: "blue"
        }, {
            id: 3,
            resourceId: 3,
            label: "Pure svelte",
            from: time("11:00"),
            to: time("13:00"),
            classes: "green"
        }, {
            id: 4,
            resourceId: 4,
            label: "component",
            from: time("13:00"),
            to: time("15:00"),
            classes: "orange"
        }]
    };

    $options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
        timeRanges,
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
    }

    let gantt;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function generate() {
        const rows = [];
        const tasks = [];

        const ids = [...Array(rowCount).keys()];
        shuffle(ids);

        for (let i = 0; i < rowCount; i++) {
            let rand_bool = Math.random() < 0.2;

            rows.push({
                id: i,
                label: 'Row #' + i,
                age: (Math.random() * 80) | 0,
                imageSrc: 'Content/joe.jpg',
                classes: rand_bool ? ['row-disabled'] : undefined,
                enableDragging: !rand_bool,
                generation
            });

            rand_bool = Math.random() > 0.5;

            const rand_h = (Math.random() * 10) | 0
            const rand_d = (Math.random() * 5) | 0 + 1

            tasks.push({
                type: 'task',
                id: ids[i],
                resourceId: i,
                label: 'Task #' + ids[i],
                from: time(`${7 + rand_h}:00`),
                to: time(`${7 + rand_h + rand_d}:00`),
                classes: colors[(Math.random() * colors.length) | 0],
                generation
            });
        }

        generation += 1;

        return { rows, tasks };
    }

    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign($options, opts);
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
    <title>Usage as svelte - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt">
        <SvelteGantt bind:this={gantt}  {...$options}></SvelteGantt>
    </div>
    <GanttOptions options={$options} on:change={onChangeOptions}/>
</div>