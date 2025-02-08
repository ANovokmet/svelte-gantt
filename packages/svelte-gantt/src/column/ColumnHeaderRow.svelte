<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';
    const dispatch = createEventDispatcher();

    import { getAllPeriods } from '../utils/date';
    import { getPositionByDate } from '../utils/utils';
    import { whenEnterPress } from '../utils/dom';

    const { from, to, width } = getContext('dimensions');
    const { dateAdapter } = getContext('options');

    export let header;

    export let ganttBodyColumns;
    export let ganttBodyUnit;

    $: {
        if (header.unit === ganttBodyUnit) {
            header.columns = ganttBodyColumns.map(column => ({
                ...column,
                label: dateAdapter.format(column.from, header.format)
            }));
        } else {
            const periods = getAllPeriods($from.valueOf(), $to.valueOf(), header.unit, header.offset);
            let distance_point = 0;
            let left = 0;

            header.columns = periods.map(period => {
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
    }

    function onHeaderClick(_header) {
        dispatch('dateSelected', { from: _header.from, to: _header.to, unit: header.unit });
    }
</script>

<div class="column-header-row">
    {#each header.columns as _header}
        <div
            class="column-header-cell"
            role="button"
            tabindex="0"
            class:sticky={header.sticky}
            style="left:{_header.left}px;width:{_header.width}px"
            on:click={() => onHeaderClick(_header)}
            on:keydown={whenEnterPress(() => onHeaderClick(_header))}
        >
            <div class="column-header-cell-label">{_header.label || 'N/A'}</div>
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
