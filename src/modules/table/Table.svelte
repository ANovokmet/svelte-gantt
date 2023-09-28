<script context="module">
    export const type = 'table';
</script>

<script lang="ts">
    import { createEventDispatcher, onMount, getContext } from 'svelte';

    const dispatch = createEventDispatcher();

    import TableRow from './TableRow.svelte';
    import type { GanttDataStore } from "../../core/store";
    import type { TableHeader } from './tableHeader';
    import type { SvelteRow } from '../../core/row';

    export let tableWidth;
    export let paddingTop;
    export let paddingBottom;
    export let rowContainerHeight;
    export let visibleRows: SvelteRow[];
    // list of columns used in the table
    // title: label to display in the header
    // property: property of row to display in the cell
    // width: width of column
    export let tableHeaders: TableHeader[] = [{ title: 'Name', property: 'label', width: 100 }];

    const { from, to, width, visibleWidth, headerHeight } = getContext('dimensions');
    const { rowPadding, rowHeight } = getContext('options');
    const { rowStore, taskStore } = getContext('dataStore') as GanttDataStore;
    const { scrollables } = getContext('gantt');

    onMount(() => {
        dispatch('init', { module: this });
    });

    let headerContainer;
    function scrollListener(node) {
        scrollables.push({ node, orientation: "vertical" });
        
        node.addEventListener("scroll", event => {
            headerContainer.scrollLeft = node.scrollLeft;
        });

        return {
            destroy() {
                node.removeEventListener("scroll");
            }
        };
    }
    
    let scrollWidth;
    $: {
        let sum = 0;
        tableHeaders.forEach(header => {
            sum += header.width;
        });
        scrollWidth = sum;
    }

    function onRowExpanded(event) {
        const row = event.detail.row;
        row.expanded = true;
        if(row.children)
            show(row.children);
        updateYPositions();
    }

    function onRowCollapsed(event) {
        const row = event.detail.row;
        row.expanded = false;
        if(row.children)
            hide(row.children);
        updateYPositions();
    }

    function updateYPositions() {
        let y = 0;
        $rowStore.ids.forEach(id => {
            const row = $rowStore.entities[id];
            if(!row.hidden) {
                $rowStore.entities[id].y = y;
                y+= $rowHeight;
            }
        });

        $taskStore.ids.forEach(id => {
            const task = $taskStore.entities[id];
            const row = $rowStore.entities[task.model.resourceId];
            $taskStore.entities[id].top = row.y + $rowPadding;
        });
    }

    function hide(children) {
        children.forEach(row => {
            if(row.children)
                hide(row.children);
            row.hidden = true;
        });
    }

    function show(children, hidden = false) {
        children.forEach(row => {
            if(row.children)
                show(row.children, !row.expanded);
            row.hidden = hidden;
        });
    }

    // if gantt displays a bottom scrollbar and table does not, we need to pad out the table
    let bottomScrollbarVisible;
    $: {
        bottomScrollbarVisible = $width > $visibleWidth && scrollWidth <= tableWidth;
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

    <div class="sg-table-body" class:bottom-scrollbar-visible="{bottomScrollbarVisible}">
        <div class="sg-table-scroller" use:scrollListener>
            <div class="sg-table-rows" style="padding-top:{paddingTop}px;padding-bottom:{paddingBottom}px;height:{rowContainerHeight}px;"> 
                {#each visibleRows as row}
                    <TableRow
                        row={row}
                        headers={tableHeaders}
                        on:rowExpanded={onRowExpanded}
                        on:rowCollapsed={onRowCollapsed}/>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    /* This class should take into account varying widths of the scroll bar */
    .bottom-scrollbar-visible {
        padding-bottom: 17px;
    }

    .sg-table {
        overflow-x: auto;
        display: flex;
        flex-direction: column;
    }

    .sg-table-scroller {
        width: 100%;
        border-bottom: 1px solid #efefef; 
        overflow-y: hidden;
    }

    .sg-table-header {
        display: flex;
        align-items: stretch;
        overflow: hidden;
        border-bottom: #efefef 1px solid;
        background-color: #fbfbfb;
    }

    .sg-table-rows {
        
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

    :global(.sg-table-cell){
        white-space: nowrap;
        overflow: hidden;
        
        display: flex;
        align-items: center;
        flex-shrink: 0;

        padding: 0 .5em;
        height: 100%;
    }
    
    :global(.sg-table-cell:last-child) {
        flex-grow: 1;
    }
</style>