<script lang="ts">
    import { whenEnterPress } from '../utils/dom';
    import { type SvelteHeader } from '../gantt.builder.svelte';
    import type { SvelteHeader } from '@svelte-gantt/gantt-core';

    let { header }: { header: SvelteHeader } = $props();
</script>

<div class="column-header-row">
    {#each header.cells as col}
        <div
            class="column-header-cell"
            role="button"
            tabindex="0"
            class:sticky={header.header.sticky}
            style="left:{col.left}px;width:{col.width}px"
            {...col.events}
        >
            <div class="column-header-cell-label">{col.label || 'N/A'}</div>
        </div>
    {/each}
</div>

<style>
    .column-header-row {
        position: relative;
        white-space: nowrap;
        flex: 1;
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
