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
            id: 10,
            label: "Accounting",
            class: 'row-group',
            iconClass: 'fas fa-calculator',
            expanded: true,
            children: [{
                id: 11,
                label: "Petunia Mulliner"
            }, {
                id: 12,
                label: "Mélina Giacovetti"
            }, {
                id: 13,
                label: "Marlène Lasslett"
            }, {
                id: 14,
                label: "Adda Youell"
            }]
        }, {
            id: 20,
            label: "Business Development",
            class: 'row-group',
            iconClass: 'fas fa-user-tie',
            expanded: false,
            children: [{
                id: 21,
                label: "Pietra Fallow"
            }, {
                id: 22,
                label: "Mariellen Torbard"
            }, {
                id: 23,
                label: "Renate Humbee"
            }]
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
            "resourceId": 11,
            "label": "LPCVD",
            "from": time("9:00"),
            "to": time("11:00"),
            "classes": "orange"
        }, {
            "id": 2,
            "resourceId": 12,
            "label": "Entrepreneurship",
            "from": time("10:00"),
            "to": time("12:30"),
            "classes": "orange"
        }, {
            "id": 3,
            "resourceId": 13,
            "label": "PET-CT",
            "from": time("13:30"),
            "to": time("15:00"),
            "classes": "orange"
        }, {
            "id": 4,
            "resourceId": 14,
            "label": "Auditing",
            "from": time("9:30"),
            "to": time("11:30"),
            "classes": "orange"
        }, {
            "id": 5,
            "resourceId": 21,
            "label": "Security Clearance",
            "from": time("15:15"),
            "to": time("16:00"),
            "classes": "green"
        }, {
            "id": 6,
            "resourceId": 22,
            "label": "Policy Analysis",
            "from": time("14:00"),
            "to": time("17:00"),
            "classes": "blue"
        }, {
            "id": 7,
            "resourceId": 23,
            "label": "Xbox 360",
            "from": time("13:30"),
            "to": time("14:30"),
            "classes": "blue"
        }, {
            "id": 8,
            "resourceId": 3,
            "label": "GNU/Linux",
            "from": time("14:00"),
            "to": time("15:30"),
            "classes": "blue"
        }, {
            "id": 9,
            "resourceId": 4,
            "label": "Electronic Trading",
            "from": time("15:00"),
            "to": time("17:00"),
            "classes": "green"
        }, {
            "id": 10,
            "resourceId": 5,
            "label": "Alternative Medicine",
            "from": time("14:30"),
            "to": time("15:30"),
            "classes": "orange"
        }],
        dependencies: []
    }

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
    <title>Tree view - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>