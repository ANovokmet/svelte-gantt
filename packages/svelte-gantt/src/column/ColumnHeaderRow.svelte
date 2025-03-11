<script lang="ts">
    import { getContext } from 'svelte';

    import { getAllPeriods } from '../utils/date';
    import { getPositionByDate } from '../utils/utils';
    import { whenEnterPress } from '../utils/dom';
    import type { Header } from 'src/gantt';
    import type { Column } from 'src/core/column';

    const { from, to, width } = getContext('dimensions');
    const { dateAdapter } = getContext('options');

    let { 
      header = $bindable(), 
      ganttBodyColumns, 
      ganttBodyUnit,
      onDateSelected = () => undefined,
    }: {
      header: Header & { columns?: any[] }, 
      ganttBodyColumns: Column[], 
      ganttBodyUnit: string,
      onDateSelected?: (event: { from: number; to: number; unit: string; }) => void;
    } = $props();

    const columns = $derived.by(() => {
        if (header.unit === ganttBodyUnit) {
            return ganttBodyColumns.map(column => ({
                ...column,
                label: dateAdapter.format(column.from, header.format)
            }));
        } else {
            const periods = getAllPeriods($from.valueOf(), $to.valueOf(), header.unit, header.offset);
            let distance_point = 0;
            let left = 0;
            return  periods.map(period => {
                left = distance_point;
                distance_point = getPositionByDate(
                    period.to,
                    $from.valueOf(),
                    $to.valueOf(),
                    $width
                );
                return {
                    width: Math.min(distance_point - left, $width),
                    label: dateAdapter.format(period.from, header.format),
                    from: period.from,
                    to: period.to,
                    left: left
                };
            });
        }
    });

    function onHeaderClick(_header) {
      onDateSelected({ from: _header.from, to: _header.to, unit: header.unit });
    }
</script>

<div class="column-header-row">
    {#each columns as col}
        <div
            class="column-header-cell"
            role="button"
            tabindex="0"
            class:sticky={header.sticky}
            style="left:{col.left}px;width:{col.width}px"
            onclick={() => onHeaderClick(col)}
            onkeydown={whenEnterPress(() => onHeaderClick(col))}
        >
            <div class="column-header-cell-label">{col.label || 'N/A'}</div>
        </div>
    {/each}
</div>

<style>
    .column-header-row {
        position: relative;

        white-space: nowrap;
        height: 32px;
    }

    .column-header-cell {
        position: absolute;

        height: 100%;
        box-sizing: border-box;
        text-overflow: clip;
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

        border-right: var(--sg-column-header-border-color) 1px solid;
        border-bottom: var(--sg-column-header-border-color) 1px solid;
    }

    .column-header-cell:hover {
        background: var(--sg-column-header-bg-hover);
    }

    .column-header-cell.sticky > .column-header-cell-label {
        position: sticky;
        left: 1rem;
    }
</style>
