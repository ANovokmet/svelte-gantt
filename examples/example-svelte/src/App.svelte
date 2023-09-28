<script>
    import Nav from './components/Nav.svelte';  
    import { Router, Route, navigate, Link } from "svelte-routing";
    import LargeDataset from './routes/LargeDataset.svelte';
    import Dependencies from './routes/Dependencies.svelte';
    import External from './routes/External.svelte';
    import Events from './routes/Events.svelte';
    import Tree from './routes/Tree.svelte';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';

    let showOptions = false;
    function onToggleOptions() {
        showOptions = !showOptions;
    }

    let optionsStream = new writable({});
    function onChangeOptions(event) {
        const opts = event.detail;
        $optionsStream = opts;
        optionsStream.set(opts);
        console.log('onChangeOptions', opts);
    }

    setContext('options', { optionsStream, toggle: new writable(false) });

    function onLoadRoute(event) {
        navigate(event.detail.url);
    }
</script>

<style>
    .container {
        display: flex;
        overflow: auto;
        flex: 1;
    }
</style>

<Nav on:updateOptions={onChangeOptions} on:toggleOptions={onToggleOptions} on:loadRoute={onLoadRoute}/>
<div class="container">
    <Router basepath="/svelte-gantt">
        <Route path="/" component="{LargeDataset}" />
        <Route path="/dependencies" component="{Dependencies}" />
        <Route path="/tree" component="{Tree}" />
        <Route path="/external" component="{External}" />
        <Route path="/events" component="{Events}" />
    </Router>

    {#if showOptions}
        <!-- <GanttOptions options={options} on:change={onChangeOptions}/> -->
    {/if}
</div>