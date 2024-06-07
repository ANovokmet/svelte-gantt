<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';

    import TableTreeCell from './TableTreeCell.svelte';
    import type { TableHeader } from './tableHeader';
    import type { SvelteRow } from '../../core/row';

    export let headers: TableHeader[] = null;
    export let row: SvelteRow = null;

    const { hoveredRow, selectedRow } = getContext('gantt');

    const dispatch = createEventDispatcher();

    let treeIndentationStyle = '';
    $: {
        treeIndentationStyle = row.parent ? `padding-left: ${row.childLevel * 3}em;` : '';
    }
</script>

<div
    data-row-id={row.model.id}
    style="height:{row.height}px"
    class="sg-table-row {row.model.classes || ''}"
    class:sg-row-expanded={row.model.expanded}
    class:sg-hover={$hoveredRow == row.model.id}
    class:sg-selected={$selectedRow == row.model.id}
>
    {#each headers as header}
        <div class="sg-table-body-cell sg-table-cell" style="width:{header.width}px">
            {#if header.type == 'tree'}
                <TableTreeCell on:rowCollapsed on:rowExpanded {row}>
                    {#if row.model.iconClass}
                        <div class="sg-table-icon">
                            <i class={row.model.iconClass}></i>
                        </div>
                    {/if}

                    {#if row.model.headerHtml}
                        {@html row.model.headerHtml}
                    {:else if header.renderer}
                        {@html header.renderer(row)}
                    {:else}
                        {row.model[header.property]}
                    {/if}
                </TableTreeCell>
            {:else}
                {#if row.model.iconClass}
                    <div class="sg-table-icon">
                        <i class={row.model.iconClass}></i>
                    </div>
                {/if}

                {#if row.model.headerHtml}
                    {@html row.model.headerHtml}
                {:else if header.renderer}
                    {@html header.renderer(row)}
                {:else if header.type === 'resourceInfo'}
                    <img class="sg-resource-image" src={row.model.imageSrc} alt="" />
                    <div class="sg-resource-title">
                        {row.model[header.property]}
                    </div>
                {:else}
                    {row.model[header.property]}
                {/if}
            {/if}
        </div>
    {/each}
</div>

<style>
    .sg-table-row {
        display: inline-flex;
        min-width: 100%;
        align-items: stretch;

        position: relative;

        font-weight: 400;
        font-size: 14px;  
        transition: height 0.2s;
    }

    .sg-table-cell {
        border-right: 1px solid #eee;
    }

    .sg-table-cell:last-child {
        border-right: 0;
    }

    .sg-table-body-cell {
        border-bottom: #efefef 1px solid;
        background-color: #fff;
        font-weight: bold;
    }

    .sg-table-row:last-child > .sg-table-body-cell {
        border-bottom: 0;
    }

    .sg-resource-image {
        width: 2.4em;
        height: 2.4em;
        border-radius: 50%;
        margin-right: 0.6em;

        background: #047c69;
    }

    .sg-resource-info {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .sg-table-icon {
        margin-right: 0.5em;
    }
</style>
