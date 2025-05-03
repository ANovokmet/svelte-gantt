<script lang="ts">
    import TableRow from './TableRow.svelte';
    import { TableBuilder } from './table.builder';
    import { useGantt } from '../../gantt';

    const gantt = useGantt();
    const builder = new TableBuilder(gantt);

    gantt.setTable(builder);
</script>

<div class="sg-table sg-view" {...builder.attr}>
    <div class="sg-table-header">
        {#each builder.headers as header}
            <div class="sg-table-header-cell sg-table-cell" style="width:{header.width}px">
                {header.title}
            </div>
        {/each}
    </div>

    <div data-sg-scroll-listener="vertical" class="sg-table-body" style:padding-bottom={`${gantt.bottomScrollbarVisible}px`}>
        <div class="sg-table-rows" style="height:{gantt.virtual.totalHeight}px;">
            <div style="transform: translateY({gantt.virtual.virtualOffset}px);">
                {#each builder.visibleRowBuilders as row}
                    <TableRow builder={row} />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .sg-table {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow-x: auto;
    }

    .sg-table-scroller {
        width: 100%;
        /* border-bottom: 1px solid #efefef; // instead of padding-bottom use an element (with borders) */
        overflow-y: hidden;
    }

    .sg-table-header {
        display: flex;
        align-items: stretch;
        overflow: hidden;
        border-bottom: 1px solid var(--sg-table-header-cell-border-color);
        background: var(--sg-table-header-cell-bg);
        height: var(--sg-header-height);
    }

    .sg-table-body {
        display: flex;
        flex: 1 1 0;
        width: 100%;
        overflow-y: hidden;
    }

    .sg-table-header-cell {
        font-size: 14px;
        font-weight: 400;
    }

    :global(.sg-table-cell) {
        white-space: nowrap;
        overflow: hidden;

        display: flex;
        align-items: center;
        flex-shrink: 0;

        padding: 0 0.5em;
        height: 100%;
    }

    :global(.sg-table-cell:last-child) {
        flex-grow: 1;
    }
</style>
