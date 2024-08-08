<script lang="ts">
    import { normalizeClassAttr } from '../utils/dom';
    import type { SvelteRow } from '../core/row';
    import { getContext } from 'svelte';
    export let row: SvelteRow;
    const { hoveredRow, selectedRow } = getContext('gantt');

    $: classes = normalizeClassAttr(row.model.classes);
</script>

<div
    class="sg-row {classes}"
    data-row-id={row.model.id}
    class:sg-hover={$hoveredRow == row.model.id}
    class:sg-selected={$selectedRow == row.model.id}
    style="height:{row.height}px"
>
    {#if row.model.contentHtml}
        {@html row.model.contentHtml}
    {/if}
</div>

<style>
    .sg-row {
        position: relative;
        width: 100%;
        box-sizing: border-box;
    }
</style>
