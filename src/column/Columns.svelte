<script lang="ts">
    import { getContext } from "svelte";
    import Column from './Column.svelte';

    /**
     * Container component for columns rendered as gantt body background
     */
    export let columns = [];

    export let columnStrokeWidth = 1;
    export let columnStrokeColor = '#efefef';
    export let highlightWeekends;
    export let columnUnit;
    export let columnOffset;
    export let highlightColor;

    const { from } = getContext('dimensions');

    function lineAt(ctx, x) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 20);
        ctx.stroke();
    }

    function createBackground(columns) {
        const canvas = document.createElement('canvas');
        canvas.width = (columns.length - 1) * columns[0].width;
        canvas.height = 20;

        const ctx = canvas.getContext('2d');
        ctx.shadowColor = "rgba(128,128,128,0.5)";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0.5;
        ctx.lineWidth = columnStrokeWidth;
        ctx.lineCap = "square";
        ctx.strokeStyle = columnStrokeColor;
        ctx.translate(0.5, 0.5);

        columns.forEach(column => {
            lineAt(ctx, column.left);
        });

        const dataURL = canvas.toDataURL();
        return `url("${dataURL}")`;
    }

    function createWeekEndsHighlight(columns) {
        const start_gantt = new Date($from);
        const dayStart = start_gantt.getDay();

        const startIndex = (dayStart == 0 ? 7 : 7 - dayStart);
        const canvas = document.createElement('canvas');
        canvas.width = (columns.length) * columns[0].width;
        canvas.height = 20;

        const ctx = canvas.getContext('2d');
        ctx.shadowColor = "rgba(128,128,128,0.5)";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0.5;
        ctx.lineWidth = columns[0].width;
        ctx.lineCap = "square";
        ctx.strokeStyle = highlightColor; 
        ctx.translate(0.5, 0.5);
        
        columns.forEach(function(column, index){
            if(index == startIndex) lineAt(ctx, column.left-columns[0].width/2);
            if(index == startIndex + 1) lineAt(ctx, column.left-columns[0].width/2);
        })

        const dataURL = canvas.toDataURL();
        return `url("${dataURL}")`;
    }

    let backgroundImage;
    let backgroundWeekends;
    $: {
        backgroundImage = createBackground(columns.slice(0,5));
        backgroundWeekends = createWeekEndsHighlight(columns.slice(0,7));
    }
</script>

<!-- <div class="sg-columns" style="background-image:{backgroundImage};"> -->
<div class="sg-columns">
	{#each columns as column}
	    <Column left={column.left} width={column.width} />
	{/each}
</div>

{#if columnUnit == 'day' && columnOffset == 1 && highlightWeekends}
<div class="sg-columns" style="background-image:{backgroundWeekends};"></div>
{/if}

<style>
    .sg-columns {
        position: absolute;
        height: 100%;
        width: 100%;
        overflow: hidden;

        background-repeat: repeat;
        background-position-x: -1px;
    }
</style>