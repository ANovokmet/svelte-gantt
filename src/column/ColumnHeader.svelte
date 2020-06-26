<script>
    import { getContext } from 'svelte';
    import { duration as momentDuration } from 'moment';
    import { getPositionByDate } from '../utils/utils';

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
            
            const offset = header.offset || 1;
            const duration = momentDuration(offset, header.unit).asMilliseconds();
            if(duration < minDuration || minDuration === null) {
                minDuration = duration;
                result = header;
            }
        });

        minHeader = result;
    }

    let baseHeaderWidth;
    $: {
        baseHeaderWidth = getPositionByDate($from.clone().add(minHeader.offset || 1, minHeader.unit), $from, $to, $width) | 0;
        if(baseHeaderWidth <= 0)
            console.error('baseHeaderWidth is invalid, columns or headers might be too short for the current view.');
    }

    let baseHeaderDuration;
    $: {
        baseHeaderDuration = momentDuration(minHeader.offset || 1, minHeader.unit).asMilliseconds();
    }
</script>

{#each headers as header}
<ColumnHeaderRow {header} baseWidth={baseHeaderWidth} baseDuration={baseHeaderDuration} on:dateSelected/>
{/each}

<style>
    
</style>
