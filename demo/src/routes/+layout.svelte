<script>
    import '../gantt-default.css';
    import '../main.css';
    import { showOptions, options } from './../stores/store';
    import GanttViewNavigation from '../components/GanttViewNavigation.svelte';
    import { base } from '$app/paths';

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
            <div class="header-controls__row">
                <a href="{base}/large-dataset"><button type="button">LargeDataset</button></a>
                <a href="{base}/dependencies"><button type="button">Dependencies</button></a>
                <a href="{base}/tree"><button type="button">Tree</button></a>
                <a href="{base}/external"><button type="button">External</button></a>
                <a href="{base}/events"><button type="button">Events</button></a>
                <a href="{base}/multiple-charts"><button type="button">Multiple gantt</button></a>
                <a href="{base}/svelte-component"><button type="button">Usage as svelte component</button></a>
                <a href="{base}/column-styles"><button type="button">Column styles</button></a>
                <a href="{base}/pack-layout"><button type="button">Layouts</button></a>
                <a href="{base}/create-tasks"><button type="button">Create tasks</button></a>
            </div>
    
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
        flex-wrap: wrap;
    }
    
    .header button, .header input[type=button] {
        margin-right: 4px;
    }
</style>