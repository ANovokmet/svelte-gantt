<script>
    import { createEventDispatcher, getContext } from 'svelte';

    const dispatch = createEventDispatcher();

    import { duration as momentDuration } from 'moment';

    const { from, to, width } = getContext('dimensions');
    
    export let header;
    export let baseWidth;
    export let baseDuration;

    export let columnWidth;
    $: {
        const offset = header.offset || 1;
        const duration = momentDuration(offset, header.unit).asMilliseconds();
        const ratio = duration / baseDuration;
        columnWidth = baseWidth * ratio;
    }

    export let columnCount;
    $: {
        columnCount = Math.ceil($width / columnWidth);
        if(!isFinite(columnCount)){
            console.error('columnCount is not finite');
            columnCount = 0;
        }
    }

    let _headers = [];
    $: {
        const headers = [];
        let headerTime = $from.clone().startOf(header.unit);
        const offset = header.offset || 1;

        for(let i = 0; i < columnCount; i++){
            headers.push({
                width: Math.min(columnWidth, $width), 
                label: headerTime.format(header.format),
                from: headerTime.clone(),
                to: headerTime.clone().add(offset, header.unit),
                unit: header.unit
            });
            headerTime.add(offset, header.unit);
        }
        _headers = headers;
    }
</script>

<div class="column-header-row">
    {#each _headers as header}
        <div class="column-header-cell" style="width:{header.width}px" on:click="{() => dispatch('dateSelected', { from: header.from, to: header.to, unit: header.unit })}">
            {header.label || 'N/A'}
        </div>
    {/each}
</div>
<style>
    .column-header-row {
        box-sizing: border-box;
        white-space: nowrap;
        overflow: hidden;

        height: 32px;
    }

    .column-header-cell {
        position: relative;
        display: inline-block;
        height: 100%;
        box-sizing: border-box;
        text-overflow: clip;
        /* vertical-align: top; */
        text-align: center;

        display: inline-flex;
        justify-content: center;
        align-items: center;
        font-size: 1em;    
        font-size: 14px;
        font-weight: 300;
        transition: background 0.2s;

        cursor: pointer;     
        user-select: none;
    }

    .column-header-cell:hover {
        background: #f9f9f9;
    }
    
</style>