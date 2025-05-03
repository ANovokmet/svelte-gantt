<script lang="ts">
    import { getContext } from 'svelte';
    import { createDraggableBuilder, type SvelteTimeRange } from '@svelte-gantt/gantt-core';
    import { cssStringify, normalizeClassAttr } from '../utils/dom';
    import { isResizable } from '../utils/utils';
    import { useGantt } from '../gantt';

    const { utils, columnService } = getContext('gantt');
    const gantt = useGantt();

    let { timeRange }: { timeRange: SvelteTimeRange } = $props();

    let classes = $derived(normalizeClassAttr(timeRange.model.classes));

    let ref = $state<HTMLElement>();

    const drag = createDraggableBuilder({
      dragAllowed: false,
      resizeAllowed: () => isResizable(timeRange.model),
      resizeHandleWidth: 5, // gantt.options.resizeHandleWidth,
      id: String(timeRange.model.id),
      get nodeRef() { return ref; },
      onDrop(event) {
        const { model } = timeRange;
        const newFrom = utils.roundTo(columnService.getDateByPosition(event.x));
        const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
        const newLeft = columnService.getPositionByDate(newFrom);
        const newRight = columnService.getPositionByDate(newTo);

        model.from = newFrom;
        model.to = newTo;

        // gantt.timeRangeStore.update({
        //   left: newLeft,
        //   width: newRight - newLeft,
        //   model,
        //   resizing: undefined // TODO:: remove
        // });

        gantt.timeRangeStore.update(model.id, {
          from: newFrom,
          to: newTo,
        });
      }
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

    // TODO:: apply an id to both body and header
</script>

<div
  use:drag.ref
  {...drag.attrs}
  {...drag.listeners}
  class="sg-time-range-control {classes}"
  data-sg-time-range-header
  style={cssStringify(transform)}
  class:sg-time-range-disabled={!timeRange.resizable}
>
    <div class="sg-time-range-handle-left"></div>
    <div class="sg-time-range-handle-right"></div>
</div>

<style>
    .sg-time-range-control {
        position: absolute;
        bottom: 0;
    }

    .sg-time-range-handle-left {
        position: absolute;
        left: 0;
    }

    .sg-time-range-handle-right {
        position: absolute;
        right: 0;
    }

    .sg-time-range-disabled {
        display: none;
    }

    .sg-time-range-handle-left::before,
    .sg-time-range-handle-right::before {
        position: absolute;
        content: '';
        bottom: 4px;
        border-radius: 6px 6px 6px 0;
        border: 2px solid #b0b0b7;
        width: 9px;
        height: 9px;
        transform: translateX(-50%) rotate(-45deg);
        background-color: #fff;

        border-color: #e03218;
        cursor: ew-resize;
    }
</style>
