<script lang="ts">
    import type { SvelteTimeRange } from '../core/timeRange';
    import { createDraggableBuilder } from '@svelte-gantt/gantt-core';
    import { cssStringify, normalizeClassAttr } from '../utils/dom';

    let { timeRange }: { timeRange: SvelteTimeRange } = $props();
    

    let classes = $derived(normalizeClassAttr(timeRange.model.classes));

    const drag = createDraggableBuilder({
      id: String(timeRange.model.id),
      dragAllowed: false,
      resizeAllowed: false,
    });

    const transform = $derived.by(() => {
      return {
        left: `${timeRange.left}px`, 
        width: `${timeRange.width}px`,
        ...drag.transform ? { 
          left: `${drag.transform.x}px`, 
          width: `${drag.transform.width}px` 
        } : null
      };
    });
</script>

<div
  {...drag.attrs}
  class="sg-time-range {classes}"
  data-sg-time-range
  class:moving={timeRange.resizing}
  style={cssStringify(transform)}
>
  {#if timeRange.model.label}
    <div class="sg-time-range-label">{timeRange.model.label}</div>
  {/if}
</div>

<style>
  .sg-time-range {
    height: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;

    background-image: linear-gradient(
        -45deg,
        transparent 46%,
        #e03218 49%,
        #e03218 51%,
        transparent 55%
    );
    background-size: 6px 6px !important;
    font-weight: 400;
  }

  .sg-time-range-label {
    margin-top: 10px;
    background: #fff;
    color: red;
    white-space: nowrap;
    padding: 4px;
    font-weight: 400;
    font-size: 10px;
  }
</style>
