<script>
    import { SvelteGantt, SvelteGanttDependencies, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
    import { onMount, getContext } from 'svelte';
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

    export const data = {
        rows: [{
            id: 1,
            label: "Accounting",
        }, {
            id: 2,
            label: "Business Development",
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
            id: 3,
            resourceId: 1,
            label: "PET-CT",
            from: time("13:30"),
            to: time("15:00"),
            classes: "orange"
        }, {
            id: 4,
            resourceId: 1,
            label: "Auditing",
            from: time("9:30"),
            to: time("11:30"),
            classes: "orange"
        }, {
            id: 5,
            resourceId: 2,
            label: "Security Clearance",
            from: time("15:15"),
            to: time("16:00"),
            classes: "green"
        }, {
            id: 6,
            resourceId: 2,
            label: "Policy Analysis",
            from: time("14:00"),
            to: time("17:00"),
            classes: "blue"
        }, {
            id: 7,
            resourceId: 2,
            label: "Xbox 360",
            from: time("13:00"),
            to: time("14:00"),
            classes: "blue"
        }, {
            id: 8,
            resourceId: 3,
            label: "GNU/Linux",
            from: time("14:00"),
            to: time("15:30"),
            classes: "blue"
        }, {
            id: 9,
            resourceId: 4,
            label: "Electronic Trading",
            from: time("15:00"),
            to: time("17:00"),
            classes: "green"
        }, {
            id: 10,
            resourceId: 5,
            label: "Alternative Medicine",
            from: time("14:30"),
            to: time("15:30"),
            classes: "orange"
        }],
        dependencies: []
    }

    let options = {
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        rows: data.rows,
        tasks: data.tasks,
        dependencies: data.dependencies,
        timeRanges: [],
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
        taskElementHook: (node, task) => {
            let popup;
            function onHover() {
                console.log('[task] hover', task);
                popup = createPopup(task, node);
            }

            function onLeave() {
                console.log('[task] hover', task);
                if(popup) {
                    popup.remove();
                }
            }

            node.addEventListener('mouseenter', onHover);
            node.addEventListener('mouseleave', onLeave);

            return {
                destroy() {
                    console.log('[task] destroy');
                    node.removeEventListener('mouseenter', onHover);
                    node.removeEventListener('mouseleave', onLeave);
                }
            }
        },
        // taskContent: (task) => `${task.label} ${task.from.format('HH:mm')}`
    }

    let gantt;
    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt-events'), props: options });

        gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
        //gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
        gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
        //gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
        gantt.api.tasks.on.change(([data]) => console.log('Listener: task change', data));
        gantt.api.tasks.on.changed((task) => console.log('Listener: task changed', task));
        gantt.api.tasks.on.dblclicked((task) => console.log('Listener: task double clicked', task));
    });

    function createPopup(task, node) {
        const rect = node.getBoundingClientRect();
        const div = document.createElement('div');
        div.className = 'sg-popup';
        div.innerHTML = `
            <div class="sg-popup-title">${task.label}</div>
            <div class="sg-popup-item">
                <div class="sg-popup-item-label">From:</div>
                <div class="sg-popup-item-value">${new Date(task.from).toLocaleTimeString()}</div>
            </div>
            <div class="sg-popup-item">
                <div class="sg-popup-item-label">To:</div>
                <div class="sg-popup-item-value">${new Date(task.to).toLocaleTimeString()}</div>
            </div>
        `;
        div.style.position = 'absolute';
        div.style.top = `${rect.bottom}px`;
        div.style.left = `${rect.left + rect.width / 2}px`;
        document.body.appendChild(div);
        return div;
    }

    function onChangeOptions(event) {
        const opts = event.detail;
        Object.assign(options, opts);
        gantt.$set(options);
    }
</script>

<style>
    #example-gantt-events {
        flex-grow: 1;
        overflow: auto;
    }

    .container {
        display: flex;
        overflow: auto;
        flex: 1;
    }

    #example-gantt-events :global(.sg-hover) {
        background-color: #00000008;
    }

    #example-gantt-events :global(.sg-hover .sg-table-body-cell) {
        background-color: #00000008;
    }
</style>

<svelte:head>
    <title>Gantt events - svelte-gantt</title> 
</svelte:head>
<div class="container">
    <div id="example-gantt-events"></div>
    <GanttOptions options={options} on:change={onChangeOptions}/>
</div>