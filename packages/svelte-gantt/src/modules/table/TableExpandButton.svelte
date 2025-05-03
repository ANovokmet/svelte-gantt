<script lang="ts">
    import { whenEnterPress } from '../../utils/dom';
    import type { SvelteRow } from '../../core/row';

    interface Props {
        row: SvelteRow;
        expandIconHtml?: string;
        collapseIconHtml?: string;
    }

    let {
        row,
        expandIconHtml = null,
        collapseIconHtml = null,
    }: Props = $props();
</script>

<div
class="sg-tree-expander"
role="button"
tabindex="0"
onclick={row.toggleExpanded}
onkeydown={whenEnterPress(row.toggleExpanded)}
>
{#if row.expanded}
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

<style>
    .sg-tree-expander {
        cursor: pointer;
        min-width: 1.4em;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .sg-tree-icon {
        width: 1rem;
        height: 1rem;
    }
</style>
