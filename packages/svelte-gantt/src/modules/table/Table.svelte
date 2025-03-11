<script module>
    export const type = 'table';
</script>

<script lang="ts">
    import { getContext } from 'svelte';

    import TableRow from './TableRow.svelte';
    import type { GanttDataStore } from '../../core/store';
    import type { TableHeader } from './tableHeader';
    import type { SvelteRow } from '../../core/row';

    // list of columns used in the table
    // title: label to display in the header
    // property: property of row to display in the cell
    
    interface Props {
        tableWidth: any;
        paddingTop: any;
        rowContainerHeight: any;
        visibleRows: SvelteRow[];
        // width: width of column
        tableHeaders?: TableHeader[];
    }

    let {
        tableWidth,
        paddingTop,
        rowContainerHeight,
        visibleRows,
        tableHeaders = [{ title: 'Name', property: 'label', width: 100 }]
    }: Props = $props();

    const { headerHeight, bottomScrollbarVisible } = getContext('dimensions');
    const { rowPadding, rowHeight } = getContext('options');
    const { rowStore, taskStore } = getContext('dataStore');
    const { scrollables, updateLayout } = getContext('gantt');

    let headerContainer = $state<HTMLElement>();
    function scrollListener(node: HTMLElement) {
        scrollables.push({ node, orientation: 'vertical' });

        function onScroll(event: Event) {
            headerContainer.scrollLeft = node.scrollLeft;
        }

        node.addEventListener('scroll', onScroll);

        return {
            destroy() {
                node.removeEventListener('scroll', onScroll);
            }
        };
    }

    let scrollWidth = $derived.by(() => {
        let sum = 0;
        tableHeaders.forEach(header => {
            sum += header.width;
        });
        return sum;
    });

    function onRowExpanded(event: { row: SvelteRow }) {
        const row = event.row;
        row.model.expanded = true;
        if (row.children) show(row.children);
        updateLayout();
    }

    function onRowCollapsed(event: { row: SvelteRow }) {
        const row = event.row;
        row.model.expanded = false;
        if (row.children) hide(row.children);
        updateLayout();
    }

    function hide(children: SvelteRow[]) {
        for (const row of children) {
            if (row.children) hide(row.children);
            row.hidden = true;
        }
    }

    function show(children: SvelteRow[], hidden = false) {
        for (const row of children) {
            if (row.children) show(row.children, !row.model.expanded);
            row.hidden = hidden;
        }
    }
</script>

<div class="sg-table sg-view" style="width:{tableWidth}px;">
    <div class="sg-table-header" style="height:{$headerHeight}px" bind:this={headerContainer}>
        {#each tableHeaders as header}
            <div class="sg-table-header-cell sg-table-cell" style="width:{header.width}px">
                {header.title}
            </div>
        {/each}
    </div>

    <div class="sg-table-body" style={`padding-bottom: ${$bottomScrollbarVisible}px;`}>
        <div class="sg-table-scroller" use:scrollListener>
            <div
                class="sg-table-rows"
                style="padding-top:{paddingTop}px;height:{rowContainerHeight}px;"
            >
                {#each visibleRows as row}
                    <TableRow
                        {row}
                        headers={tableHeaders}
                        onRowExpanded={onRowExpanded}
                        onRowCollapsed={onRowCollapsed}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .sg-table {
        overflow-x: auto;
        display: flex;
        flex-direction: column;
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
