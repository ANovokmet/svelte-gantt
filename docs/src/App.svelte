<script>
    import { SvelteGantt, SvelteGanttDependencies, SvelteGanttExternal, SvelteGanttTable } from '../dist/index';
    import { onMount } from 'svelte';
    import { time } from './utils';

    const currentStart = time('06:00');
    const currentEnd = time('18:00');

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

    const options = {
        rows: [],
        tasks: [],
        timeRanges,
        headers: [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }],
        fitWidth: true,
        from: currentStart,
        to: currentEnd,
        tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
        tableWidth: 240,
        ganttTableModules: [SvelteGanttTable],
        ganttBodyModules: [SvelteGanttDependencies],
        // taskElementHook: (node, task) => {

        //     function onHover() {
        //         console.log('hover', task);
        //     }

        //     node.addEventListener('mouseenter', onHover);

        //     return {
        //         destroy() {
        //             console.log('destroy');
        //             node.removeEventListener('mouseenter', onHover);
        //         }
        //     }
        // }
        // taskContent: (task) => `${task.label} ${task.from.format('HH:mm')}`
    }

    let gantt;

    onMount(() => {
        window.gantt = gantt = new SvelteGantt({ target: document.getElementById('example-gantt'), props: options });
        //gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
        //gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
        gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
        //gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
        gantt.api.tasks.on.change(([data]) => console.log('Listener: task change', data));
        gantt.api.tasks.on.changed((task) => console.log('Listener: task changed', task));

        const external = new SvelteGanttExternal(document.getElementById('new-task'), {
            gantt,
            onsuccess: (row, date, gantt) => {
                console.log(row.model.id, date.format())
                const id = 5000 + Math.floor(Math.random() * 1000);
                gantt.updateTask({
                    id,
                    label: `Task #${id}`,
                    from: date,
                    to: date.clone().add(3, 'hour'),
                    classes: colors[(Math.random() * colors.length) | 0],
                    resourceId: row.model.id
                });
            },
            elementContent: () => {
                const element = document.createElement('div');
                element.innerHTML = 'New Task';
                element.className = 'sg-external-indicator';
                return element;
            }
        });

        router();
    });

    function onSetDayView() {
        console.log('day view set');
        gantt.$set({
            fitWidth: true,
            columnUnit: 'minute',
            columnOffset: 15,
            from: currentStart,
            to: currentEnd,
            minWidth: 1000,
            headers: [{ unit: 'day', format: 'DD.MM.YYYY' }, { unit: 'hour', format: 'HH' }]
        });
    };

    function onSetWeekView() {
        console.log('week view set');
        gantt.$set({
            fitWidth: false,
            columnUnit: 'hour',
            columnOffset: 1,
            from: currentStart.clone().startOf('week'),
            to: currentStart.clone().endOf('week'),
            minWidth: 5000,
            headers: [{ unit: 'month', format: 'MMMM YYYY', sticky: true }, { unit: 'day', format: 'ddd DD', sticky: true }]
        });
    };

    function onSetNextDay() {
        currentStart.add(1, 'day');
        currentEnd.add(1, 'day');
        console.log('set next day');

        gantt.$set({
            from: currentStart,
            to: currentEnd
        });
    };

    function onSetPreviousDay() {
        currentStart.subtract(1, 'day');
        currentEnd.subtract(1, 'day');
        console.log('set previous day');

        gantt.$set({
            from: currentStart,
            to: currentEnd
        });
    };

    let showCode = false;
    let code = ''; 
    import { generate as generateLarge } from './examples/large';
    function loadLarge() {
        const data = generateLarge();
        gantt.$set({
            ...data,
            dependencies: []
        });
        code = JSON.stringify(data, null, '  ');
    }

    import { data as dependencyData } from './examples/dependencies';
    function loadDependencies() {
        gantt.$set({...dependencyData});
        code = JSON.stringify(dependencyData, null, '  ');
    }

    import { data as treeData } from './examples/tree';
    function loadTree() {
        gantt.$set({...treeData});
        code = JSON.stringify(treeData, null, '  ');
    }

    function loadRoute(name) {
        location.hash = `#/${name}`;
    }

    const routes = {
        '/dependencies': loadDependencies,
        '/tree': loadTree,
        '/large': loadLarge,
        '': loadLarge
    }

    function router() {
        const url = location.hash.slice(1);
        routes[url]();
    }
    window.addEventListener('hashchange', router);
</script>

<style>
    #example-gantt {
        flex-grow: 1;
        overflow: auto;
    }

    input[type=button] {
        border: transparent;
        font-size: 14px;
        font-weight: 300;
        padding: 6px 12px;
        background: #cc595e;
        color: #ffffff;
        cursor: pointer;
        transition: background 0.2s;
        outline: none;
    }
    
    input[type=button]:hover {
        background-color: #b14d51;
    }
    
    input[type=button]:active {
        background-color: #9d4548;
    }
    
    .header {
        display: flex;
        padding: 16px;
        background: #ee6e73;
    }
    
    @media only screen and (max-width: 900px) {
        .header {
            flex-direction: column;
        }
    
        .header-title {
            justify-content: center;
            margin-bottom: 6px;
        }
    
        .header-controls {
            justify-content: center;
        }
    }
    
    .header-title {
        display: flex;
        flex: 1;
        align-items: center;
        font-size: 36px;
        padding: 0 16px;
    }
    
    .header-title a {
        color: #ffffff;
        text-decoration: none;
    }
    
    .header-controls {
        display: flex;
        align-items: center;
    }
    
    .header input {
        margin-right: 4px;
    }

    .code-float {
        margin: 0;
        min-width: 400px;
        overflow: auto;
    }

    pre {
        background-color: #f9f9f9;
        color: #333;
        font-size: 0.8em;
    }

    .container {
        display: flex;
        overflow: auto;
        flex: 1;
    }
</style>

<header class="header">
    <div class="header-title">
        <a href="https://github.com/ANovokmet/svelte-gantt">Svelte-gantt</a>
    </div>
    <div class="header-controls">

        <input type="button" value="Tree" on:click={() => loadRoute('tree')}>
        <input type="button" value="Dependencies" on:click={() => loadRoute('dependencies')}/>
        <input type="button" value="Large" on:click={() => loadRoute('large')}/>

        <input type="button" value="<" on:click={onSetPreviousDay}/>
        <input type="button" value="Day view" on:click={onSetDayView}/>
        <input type="button" value=">" on:click={onSetNextDay}/>

        <input type="button" value="Week view" on:click={onSetWeekView}/>
        <input id="new-task" type="button" value="Drag to gantt"/>
        <!-- <input type="button" value="{showCode ? 'Hide data' : 'Show data'}" on:click={() => showCode = !showCode}/> -->
    </div>
</header>
<div class="container">
    <div id="example-gantt"></div>

    {#if showCode}
    <pre class="code-float">
        {code}
    </pre>
    {/if}
</div>