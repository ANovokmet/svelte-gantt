<script>
    import { createEventDispatcher } from 'svelte';
    import { time } from '../utils';
    import { getContext } from 'svelte';

    export let currentStart = time('06:00');
    export let currentEnd = time('18:00');

    const dispatch = createEventDispatcher();

    function onUpdateOptions(options) {
        dispatch('updateOptions', options);
    }

    function onSetDayView() {
        console.log('day view set');
        onUpdateOptions({
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
        onUpdateOptions({
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
        onUpdateOptions({
            from: currentStart,
            to: currentEnd
        });
    };

    function onSetPreviousDay() {
        currentStart.subtract(1, 'day');
        currentEnd.subtract(1, 'day');
        console.log('set previous day');
        onUpdateOptions({
            from: currentStart,
            to: currentEnd
        });
    };

    let { toggle } = getContext('options');
    function onToggleOptions() {
        toggle.update(v => !v);
        dispatch('toggleOptions');
    }

    function onLoadRoute(route) {
        dispatch('loadRoute', { url: route});
    }

    import { Router, Link, Route } from "svelte-routing";
</script>

<style>
    button, input[type=button] {
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
</style>

<header class="header">
    <div class="header-title">
        <a href="https://github.com/ANovokmet/svelte-gantt">Svelte-gantt</a>
    </div>
    <div class="header-controls">
        <input type="button" value="Tree" on:click={() => onLoadRoute('/svelte-gantt/tree')}>
        <input type="button" value="Dependencies" on:click={() => onLoadRoute('/svelte-gantt/dependencies')}/>
        <input type="button" value="Large" on:click={() => onLoadRoute('/svelte-gantt/')}/>
        <input type="button" value="External" on:click={() => onLoadRoute('/svelte-gantt/external')}/>
        <input type="button" value="Events" on:click={() => onLoadRoute('/svelte-gantt/events')}/>

        <input type="button" value="<" on:click={onSetPreviousDay}/>
        <input type="button" value="Day view" on:click={onSetDayView}/>
        <input type="button" value=">" on:click={onSetNextDay}/>

        <input type="button" value="Week view" on:click={onSetWeekView}/>
        <!-- <input id="new-task" type="button" value="Drag to gantt"/> -->
        <button on:click={onToggleOptions}>|||</button>
        <!-- <input type="button" value="{showCode ? 'Hide data' : 'Show data'}" on:click={() => showCode = !showCode}/> -->
    </div>
</header>