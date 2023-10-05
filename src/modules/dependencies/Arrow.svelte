<script lang="ts">
    import { onMount } from 'svelte';

    export let startY;
    export let endY;
    export let endX;
    export let startX;
    export let minLen = 12;
    export let arrowSize = 5;
    export let stroke = 'red';
    export let strokeWidth = 2;

    onMount(() => {});

    let height;
    $: height = endY - startY;

    let width;
    $: width = endX - startX;

    let path;
    $: {
        if (startX == NaN || startX == undefined) path = 'M0 0';

        let result;
        if (startX + minLen >= endX && startY != endY) {
            result = `L ${startX + minLen} ${startY} 
                        L ${startX + minLen} ${startY + height / 2}
                        L ${endX - minLen} ${startY + height / 2}
                        L ${endX - minLen} ${endY} `;
        } else {
            result = `L ${startX + width / 2} ${startY} 
                        L ${startX + width / 2} ${endY}`;
        }

        // -2 so the line doesn't stick out of the arrowhead
        path = `M${startX} ${startY}` + result + `L ${endX - 2} ${endY}`;
    }

    let arrowPath;
    $: {
        if (endX == NaN || endX == undefined) arrowPath = 'M0 0';

        arrowPath = `M${endX - arrowSize} ${endY - arrowSize} L${endX} ${endY} L${
            endX - arrowSize
        } ${endY + arrowSize} Z`;
    }
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    shape-rendering="crispEdges"
    class="arrow"
    height="100%"
    width="100%"
>
    <path d={path} {stroke} stroke-width={strokeWidth} fill="transparent" class="select-area" />
    <path d={arrowPath} fill={stroke} />
</svg>

<style>
    .arrow {
        position: absolute;
        left: 0px;
        pointer-events: none;
    }

    .select-area {
        pointer-events: visible;
        position: absolute;
    }
</style>
