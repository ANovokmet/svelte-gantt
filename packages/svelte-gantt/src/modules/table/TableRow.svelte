<script lang="ts">
    import TableExpandButton from './TableExpandButton.svelte';
    import { TableRowBuilder } from './table-row.builder';

    interface Props {
      builder: TableRowBuilder;
    }

    let { builder }: Props = $props();

    const row = $derived(builder.row);
</script>

<div
    data-row-id={row.model.id}
    class="sg-table-row {builder.classes} sg-table-row-level-{row.depth}"
    class:sg-row-expanded={row.model.expanded}
    class:sg-hover={row.hovered}
    class:sg-selected={row.selected}
    {...builder.attr}
>
    {#each builder.gantt.table.headers as header, i}
        <div class="sg-table-body-cell sg-table-cell" style="width:{header.width}px">
          {#if i === 0 && row.children}
            <TableExpandButton {row} />
          {/if}
          {#if row.model.headerHtml}
              {@html row.model.headerHtml}
          {:else if header.renderer}
              {@html header.renderer(row)}
          {:else}
              {row.model[header.property]}
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
        border-right: 1px solid var(--sg-table-cell-border-color);
    }

    .sg-table-cell:last-child {
        border-right: 0;
    }

    .sg-table-body-cell {
        border-bottom: 1px solid var(--sg-table-cell-border-color);
        font-weight: bold;
    }

    .sg-table-row:last-child > .sg-table-body-cell {
        border-bottom: 0;
    }
</style>
