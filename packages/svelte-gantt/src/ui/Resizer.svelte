<script lang="ts">
  import { createDraggableBuilder } from '@svelte-gantt/gantt-core';
  import { cssStringify, setCursor } from '../utils/dom';

  type Props = {
    x: number;
    container: HTMLElement;
    onResize(event: { left: number; });
  }

  let { x = $bindable(), container, onResize }: Props = $props();

  const drag = createDraggableBuilder({
    id: Symbol('resizer') as unknown as string,
    get nodeRef() { return ref; }, // not actually needed in this case
    get container() { return container },
    dragAllowed: true,
    resizeAllowed: false,
    onDrop(event) {
      onResize({ left: event.x });
      setCursor('default');
    },
  });

  $effect(() => {
    if (drag.transform) {
      onResize({ left: drag.transform.x });
      setCursor('col-resize');
    }
  });

  let ref = $state<HTMLElement>();

  const transform = $derived.by(() => {
    return {
      left: drag.transform ? `${drag.transform.x}px` : `${x}px`,
    };
  });
</script>

<div
  bind:this={ref}
  class="sg-resize"
  {...drag.attrs}
  {...drag.listeners} 
  style={cssStringify(transform)}>
</div>

<style>
  .sg-resize {
    z-index: 2;
    background: var(--sg-resize-color);
    width: 5px;
    cursor: col-resize;
    position: absolute;
    height: 100%;

    transition: width 0.2s, transform 0.2s;
  }

  .sg-resize:hover {
    transform: translateX(-2px);
    width: 10px;
  }
</style>
