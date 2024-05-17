<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import { options } from '../../stores/store';

    let generation = 0;
    let rowCount = 100;
    const colors = ['blue', 'green', 'orange'];

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

    $options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
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

    const data1 = generate();
    const data2 = generate();

    $: {
        console.log('options changed', $options);
        gantt1 && gantt1.$set($options);
        gantt2 && gantt2.$set($options);
    }

    /** @type {import('svelte-gantt').SvelteGanttComponent} */
    let gantt1;
    /** @type {import('svelte-gantt').SvelteGanttComponent} */
    let gantt2;
    onMount(() => {
        window.gantt1 = gantt1 = new SvelteGantt({
            target: document.getElementById('example-gantt-1'),
            props: { ...$options, ...data1 }
        });
        window.gantt2 = gantt2 = new SvelteGantt({
            target: document.getElementById('example-gantt-2'),
            props: { ...$options, ...data2 }
        });
    });

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
        Object.assign(options, opts);
        gantt1.$set(options);
        gantt2.$set(options);
    }
</script>

<style>
    #example-gantt-1, #example-gantt-2 {
        flex-grow: 1;
        overflow: auto;
    }

    .container {
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex: 1;
    }
</style>

<svelte:head>
    <title>Multiple charts - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt-1"></div>
    <div id="example-gantt-2"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>