<script lang="ts">
    import { type SvelteTask } from '../../core/task';
    import { drawPath } from './dependency';
    import { useGantt } from '../../gantt';
    const { rowStore, taskStore } = useGantt();

    interface Props {
      id: PropertyKey;
      fromId: PropertyKey;
      toId: PropertyKey;
      stroke?: string;
      strokeWidth?: number;
    }

    let { id, fromId, toId, stroke = undefined, strokeWidth = undefined }: Props = $props();

    let fromTask = $derived(taskStore.entities[fromId]);
    let isFromRowHidden = $derived<boolean>(!rowStore.entities[fromTask.model.resourceId].expanded);
    let toTask = $derived<SvelteTask>(taskStore.entities[toId]);
    let isToRowHidden = $derived<boolean>(!rowStore.entities[toTask.model.resourceId].expanded);
    let geometry = $derived.by(() => drawPath(fromTask, toTask, isFromRowHidden, isToRowHidden));
    let visible = $derived((!isFromRowHidden && !isToRowHidden) || isFromRowHidden !== isToRowHidden);
</script>

{#if visible}
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
