<script>
    import '../gantt-default.css'; 
    import { showOptions, options } from './../stores/store';
    import GanttViewNavigation from '../components/GanttViewNavigation.svelte';

    function onUpdateOptions(event) {
        const opts = event.detail;
        console.log('onUpdateOptions', opts);
        $options = {
            ...$options,
            ...opts
        };
    }
</script>

<div class="app">
    <header class="header">
        <div class="header-title">
            <a href="https://github.com/ANovokmet/svelte-gantt">Svelte-gantt</a>
        </div>
        <div class="header-controls">
            <a href="/large-dataset"><button type="button">LargeDataset</button></a>
            <a href="/dependencies"><button type="button">Dependencies</button></a>
            <a href="/tree"><button type="button">Tree</button></a>
            <a href="/external"><button type="button">External</button></a>
            <a href="/events"><button type="button">Events</button></a>
            <a href="/multiple-charts"><button type="button">Multiple gantt</button></a>
    
            <GanttViewNavigation options={$options} on:updateOptions={onUpdateOptions} />
    
            <button on:click={()=> {showOptions.set(!$showOptions)}}>|||</button>
        </div>
    </header>
    <slot></slot>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        overflow: auto;
        height: 100%;
    }

    button, input[type=button]{
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
    
    button:hover, input[type=button]:hover {
        background-color: #b14d51;
    }
    
    button:active, input[type=button]:active{
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
    
    .header button, .header input[type=button] {
        margin-right: 4px;
    }
</style>