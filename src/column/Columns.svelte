<script lang="ts">
    import { createBackground } from './canvas';

    /**
     * Container component for columns rendered as gantt body background
     */
    export let columns;

    export let useCanvasColumns = true;
    export let columnStrokeWidth;
    export let columnStrokeColor;
    export let columnDefaultColor = '#ffffff';

    let backgroundImage;
    $: {
        // TODO: background repeats and so do columns so passing every element is not needed, but line alignment issues occur on later rows
        // TODO: I used to make column widths and positions whole numbers, now they contain decimals again, check if this is because of that
        backgroundImage = createBackground(columns, {
            // columns.slice(0,5)
            columnStrokeColor,
            columnStrokeWidth
        });
    }
</script>

{#if useCanvasColumns}
    <div class="sg-columns sg-columns--background" style:background-image={backgroundImage}></div>
{:else}
    <div class="sg-columns">
        {#each columns as column}
            <div
                class="sg-column"
                style="
                border-right: {column.bgHighlightColor
                    ? 0
                    : columnStrokeWidth}px solid {column.bgHighlightColor || columnStrokeColor};
                left: {column.left}px;
                width: {column.width}px;
                background-color: {column.bgHighlightColor || columnDefaultColor};"
            ></div>
        {/each}
    </div>
{/if}

<style>
    .sg-columns {
        position: absolute;
        height: 100%;
        width: 100%;
        /* BUG: column borders are not showing correctly when width is very small */
    }

    .sg-columns--background {
        overflow: hidden;
        background-repeat: repeat;
        background-position-x: -1px;
    }

    .sg-column {
        position: absolute;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
    }
</style>
