<script lang="ts">
  import { createBackground } from './canvas';

  interface Props {
      /**
   * Container component for columns rendered as gantt body background
   */
    columns: any;
    useCanvasColumns?: boolean;
    columnStrokeWidth: any;
    columnStrokeColor: any;
    columnDefaultColor?: string;
  }

  let {
    columns,
    useCanvasColumns = true,
    columnStrokeWidth,
    columnStrokeColor,
    columnDefaultColor = '#ffffff'
  }: Props = $props();

  //  TODO: I used to make column widths and positions whole numbers, now they contain decimals again, check if this is because of that
  //  TODO: background repeats and so do columns so passing every element is not needed, but line alignment issues occur on later rows
  let backgroundImage = $derived(createBackground(columns, {
    // columns.slice(0,5)
    columnStrokeColor,
    columnStrokeWidth
  }));
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
