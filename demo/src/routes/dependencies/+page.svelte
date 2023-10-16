<script>
    import { SvelteGantt, SvelteGanttDependencies, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import {setView, moveView} from './../../stores/store';

    $ : triggerSetView($setView)
    $ : triggerMoveView($moveView)

    function triggerSetView(val){
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

    function triggerMoveView(val){
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

    export const data = {
        rows: [{
            "id": 1,
            "label": "Preparation and Planning"
        }, {
            "id": 2,
            "label": "Development"
        }, {
            "id": 3,
            "label": "Implementation"
        }, {
            "id": 4,
            "label": "Training"
        }, {
            "id": 5,
            "label": "Roll-out product"
        }],
        tasks: [{
            "id": 1,
            "resourceId": 1,
            "label": "Preparation",
            "from": time("7:00"),
            "to": time("9:00"),
            "classes": "orange"
        }, {
            "id": 2,
            "resourceId": 1,
            "label": "Planning",
            "from": time("9:30"),
            "to": time("11:00"),
            "classes": "orange"
        }, {
            "id": 3,
            "resourceId": 2,
            "label": "Development",
            "from": time("12:00"),
            "to": time("13:30"),
            "classes": "orange"
        }, {
            "id": 4,
            "resourceId": 3,
            "label": "Implementation",
            "from": time("13:45"),
            "to": time("15:45"),
            "classes": "orange"
        }, {
            "id": 5,
            "resourceId": 5,
            "label": "Finish",
            "from": time("17:00"),
            "to": time("17:45"),
            "classes": "green"
        }, {
            "id": 6,
            "resourceId": 4,
            "label": "Training",
            "from": time("7:00"),
            "to": time("10:00"),
            "classes": "blue"
        }],
        dependencies: [{
            id: 1,
            fromId: 1,
            toId: 2
        }, {
            id: 2,
            fromId: 2,
            toId: 3
        }, {
            id: 3,
            fromId: 3,
            toId: 4
        }, {
            id: 4,
            fromId: 4,
            toId: 5
        }, {
            id: 5,
            fromId: 6,
            toId: 5
        }]
    };

    let options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
        dependencies: data.dependencies,
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
        ganttTableModules: [SvelteGanttTable],
        ganttBodyModules: [SvelteGanttDependencies]
    }

    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
    });

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

<svelte:head>
    <title>Dependencies - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>