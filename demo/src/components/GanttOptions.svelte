<script>
import { getContext } from "svelte";

    import { createEventDispatcher } from "svelte";
    import DateTime from './DateTime.svelte';


    export let options;

    $: {
        dispatch('change', options);
    }

    const dispatch = createEventDispatcher();

    const offsetOptions = [5, 10, 15, 30];

    let { toggle, optionsStream } = getContext('options');
    $: {
        dispatch('change', $optionsStream);
    };
</script>

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


{#if $toggle}
<div class="controls">
    <h3>Options</h3>

    <div class="form-group">
        <label class="form-label"> columnOffset </label>
        <select bind:value={options.columnOffset}>
            {#each offsetOptions as offset}
                <option value={offset}>{offset}</option>
            {/each}
        </select>
    </div>

    <div class="form-group">
        <label class="form-label"> magnetOffset </label>
        <select bind:value={options.magnetOffset}>
            {#each offsetOptions as offset}
                <option value={offset}>{offset}</option>
            {/each}
        </select>
    </div>

    <div class="form-group">
        <label class="form-label"> rowHeight ({options.rowHeight}) </label>
        <input type="range" bind:value={options.rowHeight} min="20" max="100">
    </div>

    <div class="form-group">
        <label class="form-label"> rowPadding ({options.rowPadding}) </label>
        <input type="range" bind:value={options.rowPadding} min="0" max="20" step="2">
    </div>

    <div class="form-group">
        <label class="form-label"> fitWidth </label>
        <input type=checkbox bind:checked={options.fitWidth}>
    </div>

    <div class="form-group">
        <label class="form-label"> minWidth </label>
        <input type="number" bind:value={options.minWidth} min="800">
    </div>

    <div class="form-group">
        <label class="form-label"> from </label>
        <DateTime bind:value={options.from}/>
    </div>

    <div class="form-group">
        <label class="form-label"> to </label>
        <DateTime bind:value={options.to}/>
    </div>

    <div class="form-group">
        <label class="form-label"> headers[0].format </label>
        <input type="text" bind:value={options.headers[0].format}>
    </div>

    <div class="form-group">
        <label class="form-label"> headers[1].format </label>
        <input type="text" bind:value={options.headers[1].format}>
    </div>
</div>
{/if}