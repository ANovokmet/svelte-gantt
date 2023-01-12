<script>
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from '../../../dist';
    import { onMount } from 'svelte';
    import { time } from '../utils';
    import moment from 'moment';
    import GanttOptions from '../components/GanttOptions.svelte';
    
    const currentStart = moment().startOf('month').subtract(14, 'days') 
    const currentEnd = moment().startOf('isoWeek').add(24, 'months')

    let generation = 0;
    let rowCount = 100000;
    const colors = ['blue', 'green', 'orange']

    const timeRanges = [
        {
            id: 0,
            from: time('10:00'),
            to: time('12:00'),
            classes: null,
            label: 'test1'
        },
        {
            id: 1,
            from: time('15:00'),
            to: time('17:00'),
            classes: null,
            label: 'test2'
        }
    ];

    const data = generate();

    let options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
        timeRanges,
        columnOffset: 1,
        columnUnit: 'day',
        highlightedDurations: {
            unit: 'day',
            fractions: [0,4]
        },
        magnetOffset: 15,
        rowHeight: 20,
        rowPadding: 6,
        headers: [{ unit: 'year', format: 'YYYY', sticky:true }, { unit: 'month', format: 'MM', sticky:true }, { unit: 'week', format: 'WW', sticky:true }, { unit: 'day', format: 'DD', sticky:true }],
        fitWidth: true,
        minWidth: 17000,
        from: currentStart,
        to: currentEnd,
        tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
        tableWidth: 240,
        ganttTableModules: [SvelteGanttTable]
    }

    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
    });


    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function generate() {
        const rows = [];
        const tasks = [];

        const ids = [...Array(rowCount).keys()];
        shuffle(ids);

        for (let i = 1; i < rowCount; i++) {
            let rand_bool = Math.random() < 0.2;

            rows.push({
                id: i,
                label: 'Row #' + i,
                age: (Math.random() * 80) | 0,
                enableDragging: true,
                imageSrc: 'Content/joe.jpg',
                classes: rand_bool ? ['row-disabled'] : undefined,
                enableDragging: !rand_bool,
                generation
            });

            rand_bool = Math.random() > 0.5;

            for (let y = 0; y < 20; y++) {
            const rand_h = (Math.random() * 5) | 1
            const rand_d = (Math.random() * 10) | 0 + 2
            tasks.push({
                type: 'test',
                id: ids[i] * ids[i] * y +rand_h,
                resourceId: i,
                label: 'Test #' + ids[i]+y+rand_h,
                from: moment().startOf('isoWeek').add(rand_h + (y*y), 'days'),
                to: moment().startOf('isoWeek').add(rand_h + rand_d + (y*y), 'days'),
                classes: colors[(Math.random() * colors.length) | 0],
                generation
            });
            }
        }

        generation += 1;

        return { rows, tasks };
    }

    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign(options, opts);
        gantt.$set(options);
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

<div class="container">
    <div id="example-gantt"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>