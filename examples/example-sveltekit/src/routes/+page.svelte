<script lang="ts">
    import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from '$dist';
    import { onMount } from 'svelte';
    import { time } from '../utils';
    import moment from 'moment';
    import GanttOptions from '../components/GanttOptions.svelte';
    import {setView, moveView} from './../stores/store';

    $ : triggerSetView($setView)
    $ : triggerMoveView($moveView)

    function triggerSetView(val:string){
        console.log('trigger set view', val);
        if(val == 'none') return
        if(val == 'week'){
            options.fitWidth = false;
            options.columnUnit = 'hour';
            options.columnOffset = 1;
            currentStart = currentStart.clone().startOf('week');
            currentEnd = currentStart.clone().endOf('week');
            options.headers = [{ unit: 'month', format: 'MMMM YYYY', sticky: true }, { unit: 'day', format: 'ddd DD', sticky: true }]
        }else if(val == 'day'){
            options.fitWidth = true;
            options.columnUnit = 'minute';
            options.columnOffset = 15;
            currentStart = currentStart.clone().startOf('day');
            currentEnd = currentStart.clone().endOf('day');
            options.headers = [{ unit: 'day', format: 'DD.MM.YYYY' }, { unit: 'hour', format: 'HH' }]
        }
        options.from = currentStart;
        options.to = currentEnd; 
        gantt.$set(options);
        setView.set('none');
    }

    function triggerMoveView(val:string){
        if(val == 'none') return
        if(val == 'prevDay'){
            currentStart.subtract(1, 'day');
            currentEnd.subtract(1, 'day');
        }else if(val == 'nextDay'){
            currentStart.add(1, 'day');
            currentEnd.add(1, 'day');
        }
        options.from = currentStart;
        options.to = currentEnd; 
        gantt.$set(options);
        moveView.set('none');
    }

    let currentStart = time('06:00');
    let currentEnd = time('18:00');


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

    const data = generate();

    let options = {
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