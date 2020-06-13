<script>
    import { getContext } from 'svelte';
    
    import Column from './Column.svelte';
    /**
     * Container component for columns rendered as gantt body background
     */
    export let columns = [];



    function createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        ctx.translate(0.5, 0.5);


        ctx.shadowColor = "rgba(128,128,128,0.5)";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0.5;
        ctx.lineWidth = 1;
        ctx.lineCap = "square";
        ctx.strokeStyle = '#efefef';
    }

    function lineAt(x) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 20);
        ctx.stroke();
    }

    function setDataURL() {
        const dataURL = canvas.toDataURL();
        document.getElementById('canvas').appendChild(canvas);

        const result = document.getElementById('result');
        result.style.width = '960px';
        result.style.backgroundImage = `url("${dataURL}")`;
        // result.style.backgroundSize = '2304px';
        // result.style.backgroundPositionX = '-773px';

        // #result {
        //     height: 20px;
        //     z-index: 1;
        //     background-repeat: repeat;
        // }
    }
</script>

<div class="sg-columns">
	{#each columns as column}
	<Column left={column.left} width={column.width} />
	{/each}
</div>
<style>
    .sg-columns {
      position: absolute;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
</style>