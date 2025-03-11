<script lang="ts">
    import type { Header } from 'src/gantt';
    import ColumnHeaderRow from './ColumnHeaderRow.svelte';
    import type { Column } from 'src/core/column';

    interface Props {
        /**
         * Container component for header rows
         */
        headers: Header[];
        ganttBodyColumns: Column[];
        ganttBodyUnit: string;
        onDateSelected: (event: { from: number; to: number; unit: string; }) => void;
    }

    let { headers, ganttBodyColumns, ganttBodyUnit, onDateSelected }: Props = $props();
</script>

{#each headers as header}
    <ColumnHeaderRow {header} {ganttBodyColumns} {ganttBodyUnit} {onDateSelected} />
{/each}
