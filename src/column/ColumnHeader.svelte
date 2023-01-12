<script lang="ts">
    import ColumnHeaderRow from './ColumnHeaderRow.svelte';
    
    /**
     * Container component for header rows 
     */
    export let headers;
    export let ganttBodyColumns;
    export let ganttBodyUnit;

</script>

{#each headers as header}
<ColumnHeaderRow {header} {ganttBodyColumns} {ganttBodyUnit} on:dateSelected/>
{/each}

