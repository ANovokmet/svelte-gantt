<script>
    import { createEventDispatcher } from "svelte";
    import DateTime from './DateTime.svelte';
    import {showOptions} from './../stores/store';

    export let options;
    const dispatch = createEventDispatcher();

    $: {
        dispatch('change', options);
    }

    const offsetOptions = [5, 10, 15, 30];
</script>



{#if $showOptions}
<div class="controls">
    <h3>Options</h3>
    <div class="form-group">
        <label for="columnOffset" class="form-label"> columnOffset </label>
        <select id="columnOffset" bind:value={options.columnOffset}>
            {#each offsetOptions as offset}
                <option value={offset}>{offset}</option>
            {/each}
        </select>
    </div>

    <div class="form-group">
        <label for="magnetOffset" class="form-label"> magnetOffset </label>
        <select id="magnetOffset" bind:value={options.magnetOffset}>
            {#each offsetOptions as offset}
                <option value={offset}>{offset}</option>
            {/each}
        </select>
    </div>

    <div class="form-group">
        <label for="rowHeight" class="form-label"> rowHeight ({options.rowHeight}) </label>
        <input id="rowHeight" type="range" bind:value={options.rowHeight} min="20" max="100">
    </div>

    <div class="form-group">
        <label for="rowPadding" class="form-label"> rowPadding ({options.rowPadding}) </label>
        <input id="rowPadding" type="range" bind:value={options.rowPadding} min="0" max="20" step="2">
    </div>

    <div class="form-group">
        <label for="fitWidth" class="form-label"> fitWidth </label>
        <input id="fitWidth" type=checkbox bind:checked={options.fitWidth}>
    </div>

    <div class="form-group">
        <label for="minWidth" class="form-label"> minWidth </label>
        <input id="minWidth" type="number" bind:value={options.minWidth} min="800">
    </div>

    <div class="form-group">
        <label for="from" class="form-label"> from </label>
        <DateTime bind:value={options.from}/>
    </div>

    <div class="form-group">
        <label for="to" class="form-label"> to </label>
        <DateTime bind:value={options.to}/>
    </div>

    <div class="form-group">
        <label for="first-format" class="form-label"> headers[0].format </label>
        <input id="first-format"  type="text" bind:value={options.headers[0].format}>
    </div>

    <div class="form-group">
        <label for="second-format"  class="form-label"> headers[1].format </label>
        <input id="second-format"  type="text" bind:value={options.headers[1].format}>
    </div>
</div>
{/if}

<style>
    .controls {
        background: #ffc0c3;
        padding: 16px;
    }

    .form-label {
        display: block;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.5rem;
    }

    input, select {
        border: 0;
        border-bottom: 1px solid #cc595e;
        background: #cc595e36;
    }

    h3 {
        margin: 0;
        margin-bottom: 1.5rem;
    }
</style>
