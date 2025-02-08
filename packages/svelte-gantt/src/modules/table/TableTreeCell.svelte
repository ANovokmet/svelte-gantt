<script lang="ts">
    import { whenEnterPress } from '../../utils/dom';
    import type { SvelteRow } from '../../core/row';

    import { createEventDispatcher } from 'svelte';

    export let row: SvelteRow;
    export let expandIconHtml: string = null;
    export let collapseIconHtml: string = null;

    const dispatch = createEventDispatcher();

    function onExpandToggle() {
        if (row.model.expanded || row.model.expanded == null) {
            dispatch('rowCollapsed', { row });
        } else {
            dispatch('rowExpanded', { row });
        }
    }
</script>

<div class="sg-cell-inner" style="padding-left: {row.childLevel * 3}em">
    {#if row.children}
        <div
            class="sg-tree-expander"
            role="button"
            tabindex="0"
            on:click={onExpandToggle}
            on:keydown={whenEnterPress(onExpandToggle)}
        >
            {#if row.model.expanded}
                {#if expandIconHtml}
                    {@html expandIconHtml}
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="sg-tree-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                {/if}
            {:else}
                {#if collapseIconHtml}
                    {@html collapseIconHtml}
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="sg-tree-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                {/if}
            {/if}
        </div>
    {/if}
    <slot />
</div>

<style>
    .sg-tree-expander {
        cursor: pointer;
        min-width: 1.4em;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .sg-cell-inner {
        display: flex;
    }

    .sg-tree-icon {
        width: 1rem;
        height: 1rem;
    }
</style>
