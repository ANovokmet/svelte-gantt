<script lang="ts">
    import { getContext } from 'svelte';
    import { type SvelteTask } from 'src/core/task';
    const { rowStore, taskStore } = getContext('dataStore');

    interface Props {
        id: any;
        fromId: any;
        toId: any;
        stroke?: string;
        strokeWidth?: number;
    }

    let { id, fromId, toId, stroke = undefined, strokeWidth = undefined }: Props = $props();

    const MIN_LEN = 12;
    const ARROW_SIZE = 5;

    let fromTask = $derived($taskStore.entities[fromId]);
    let isFromRowHidden = $derived<boolean>($rowStore.entities[fromTask.model.resourceId].hidden);
    let toTask = $derived<SvelteTask>($taskStore.entities[toId]);
    let isToRowHidden = $derived<boolean>($rowStore.entities[toTask.model.resourceId].hidden);

    let geometry = $derived.by(() => {
        let startY = fromTask.top + fromTask.height / 2;
        let startX = fromTask.left + fromTask.width;
        let endY = toTask.top + toTask.height / 2;
        let endX = toTask.left;
        let width = endX - startX;
        let height = endY - startY;

        let path = '';
        let arrowPath = '';

        if (isFromRowHidden) {
            path = `M${endX} ${endY}`;
            if (startX + MIN_LEN >= endX && startY != endY) {
                path += `L ${endX + 1.5 - MIN_LEN} ${endY}`;
            } else {
                path += `L ${endX + 1.5 - width / 2} ${endY}`;
            }
            path += `m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4`;
            arrowPath =
                `M${toTask.left - ARROW_SIZE}  ${toTask.top + toTask.height / 2 - ARROW_SIZE}` +
                ` L${toTask.left} ${toTask.top + toTask.height / 2}` +
                ` L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`;
        } else if (isToRowHidden) {
            path = `M${startX} ${startY}`;
            if (startX + MIN_LEN >= endX && startY != endY) {
                path += `L ${startX + 1.5 + MIN_LEN} ${startY}`;
            } else {
                path += `L ${startX + 1.5 + width / 2} ${startY}`;
            }
            path += `m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4`;
            arrowPath = ``;
        } else if (!isFromRowHidden && !isToRowHidden) {
            path = `M${startX} ${startY}`;
            if (startX + MIN_LEN >= endX && startY != endY) {
                path +=
                    `L ${startX + MIN_LEN} ${startY}` +
                    ` L ${startX + MIN_LEN} ${startY + height / 2}` +
                    ` L ${endX - MIN_LEN} ${startY + height / 2}` +
                    ` L ${endX - MIN_LEN} ${endY}` +
                    ` L ${endX - 2} ${endY}`;
            } else {
                path += `L ${startX + width / 2} ${startY}` + ` L ${startX + width / 2} ${endY}` + ` L ${endX - 2} ${endY}`;
            }
            arrowPath = `M${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 - ARROW_SIZE} 
                            L${toTask.left} ${toTask.top + toTask.height / 2} 
                            L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`;
        }

        return { path, arrowPath };
    });
</script>

{#if (!isFromRowHidden && !isToRowHidden) || isFromRowHidden !== isToRowHidden}
    <div class="sg-dependency" style="left:0;top:0" data-dependency-id={id}>
        <svg class="sg-arrow" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" height="100%" width="100%">
            <path class="sg-arrow-path select-area" d={geometry.path} style:stroke style:stroke-width={strokeWidth != null ? `${strokeWidth}px` : null} />
            <path class="sg-arrow-head" d={geometry.arrowPath} style:fill={stroke} />
        </svg>
    </div>
{/if}

<style>
    .sg-dependency {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .sg-arrow {
        position: absolute;
        left: 0px;
        pointer-events: none;
    }

    :global(path.sg-arrow-path) {
        stroke: var(--sg-dependency-arrow-color);
        fill: transparent;
        stroke-width: 2px;
    }

    :global(.sg-arrow-head) {
        fill: var(--sg-dependency-arrow-color);
    }

    .select-area {
        pointer-events: visible;
        position: absolute;
    }
</style>
