<script lang="ts">
    import { getContext } from 'svelte';
    import { getPositionByDate } from '../utils/utils';
    import { getDuration } from '../utils/date';

    import ColumnHeaderRow from './ColumnHeaderRow.svelte';
    
    /**
     * Container component for header rows 
     */
    export let headers;
    export let columnUnit;
    export let columnOffset;

    const { from, to, width } = getContext('dimensions');

    let minHeader;
    $: {
        let result = null; 
        let minDuration = null;

        [...headers, {unit: columnUnit, offset: columnOffset}].forEach(header => {
            
            const duration = header.duration = header.duration || getDuration(header.unit, header.offset);
            if(duration < minDuration || minDuration === null) {
                minDuration = duration;
                result = header;
            }
        });

        minHeader = result;
    }

    let baseHeaderWidth;
    $: {
        baseHeaderWidth = getPositionByDate($from + minHeader.duration, $from, $to, $width) | 0;
        if(baseHeaderWidth <= 0)
            console.error('baseHeaderWidth is invalid, columns or headers might be too short for the current view.');
    }

    let baseHeaderDuration;
    $: {
        baseHeaderDuration = minHeader.duration;
    }
</script>

{#each headers as header}
<ColumnHeaderRow {header} baseWidth={baseHeaderWidth} baseDuration={baseHeaderDuration} on:dateSelected/>
{/each}

<style>
    
</style>
