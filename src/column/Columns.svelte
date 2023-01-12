<script lang="ts">
    /**
     * Container component for columns rendered as gantt body background
     */
    export let columns;

    export let columnStrokeWidth;
    export let columnStrokeColor;
    export let columnDefaultColor = '#ffffff';
</script>

<div class="sg-columns">
	{#each columns as column}
        <div class="sg-column" style="
            border-right: {column.bgHighlightColor ? 0 : columnStrokeWidth}px solid {column.bgHighlightColor || columnStrokeColor};
            left: {column.left}px; 
            width: {column.width}px; 
            background-color: {column.bgHighlightColor || columnDefaultColor};">
        </div>
	{/each}
</div>

<style>
    .sg-columns {
        position: absolute;
        height: 100%;
        width: 100%;
        /* BUG: column borders are not showing correctly when width is very small */
    }
    
    .sg-column {
        position: absolute;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
    }
</style>