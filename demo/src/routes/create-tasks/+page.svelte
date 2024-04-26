<script>
    import { SvelteGantt, SvelteGanttDependencies, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount, getContext } from 'svelte';
    import { time } from '../../utils';
    import moment from 'moment';
    import GanttOptions from '../../components/GanttOptions.svelte';
    import {setView, moveView} from '../../stores/store';

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

    
    let options2 = getContext('options');

    export const data = {
        rows: [{
            id: 11,
            label: "Petunia Mulliner 11"
        }, {
            id: 12,
            label: "Mélina Giacovetti 12"
        }, {
            id: 13,
            label: "Marlène Lasslett 13"
        }, {
            id: 14,
            label: "Adda Youell 14"
        }, {
            id: 21,
            label: "Pietra Fallow 21"
        }, {
            id: 22,
            label: "Mariellen Torbard 22"
        }, {
            id: 23,
            label: "Renate Humbee 23"
        }, {
            id: 3,
            label: "Ida Flewan"
        }, {
            id: 4,
            label: "Lauréna Shrigley"
        }, {
            id: 5,
            label: "Ange Kembry"
        }],
        tasks: [{
            "id": 1,
            "resourceId": 13,
            "label": "LPCVD",
            "from": time("9:00"),
            "to": time("11:00"),
            "classes": "orange"
        }],
        dependencies: []
    }

    let i = 0;

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
        ganttBodyModules: [SvelteGanttDependencies],
        enableCreateTask: true,
        onCreateTask: (e) => {
            const id = `creating-task-${(Math.random() + 1).toString(36).substring(2, 7)}`;
            return ({
                id,
                label: `New task ${++i}`,
                ...e,
            });
        },
        onCreatedTask: (task) => {
            console.log('task created', task);
        }
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
    <title>Tree view - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>