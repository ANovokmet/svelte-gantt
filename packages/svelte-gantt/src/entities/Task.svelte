<script lang="ts">
    import type { TaskModel } from '../core/task';
    import type { Snippet } from 'svelte';
    import { TaskBuilder } from './task.builder';
    import { createDraggableBuilder } from '@svelte-gantt/gantt-core';
    import { cssStringify } from '../utils/dom';

    type Props = {
      model: TaskModel;
      height: number;
      left: number;
      top: number;
      width: number;
      reflected?: boolean;
      animating?: boolean;
      selected?: boolean;
      onPointerDown?: (e: PointerEvent) => void;
      children?: Snippet<[TaskModel]>;
    }

    let {
      model,
      height,
      left,
      top,
      width,
      selected = false,
      reflected = false,
      animating = true,
      onPointerDown = () => undefined,
      children = undefined,
    }: Props = $props(); // TODO:: pass task instead of spread props

    const builder = new TaskBuilder({
      get model() { return model; },
      get height() { return height; },
      get left() { return left; },
      get top() { return top; },
      get width() { return width; },
      get selected() { return selected; },

      get reflected() { return reflected; },
      get animating() { return animating; },
      onPointerDown,
    });

    const drag = createDraggableBuilder({
      dragAllowed: true,
      resizeAllowed: true,
      resizeHandleWidth: 5,
      id: String(model.id),
      get nodeRef() { return ref; },
      onDrop(e) {
        console.log('successfully dropped', e, model);
      }
    });

    let ref = $state<HTMLElement>();

    const transform = $derived.by(() => {
      return {
        ...builder.style,
        ...drag.transform ? { 
          left: `${drag.transform.x}px`, 
          top: `${drag.transform.y}px;`, 
          width: `${drag.transform.width}px` 
        } : null
      };
    });
</script>

<div use:drag.ref {...builder.attrs} {...drag.attrs} {...drag.listeners} style={cssStringify(transform)}>
  {#if model.type === 'milestone'}
    <div class="sg-milestone__diamond"></div>
  {/if}
  {#if children}
    {@render children(model)}
  {:else}
    {model.label}
  {/if}
</div>

<style>
  [data-sg-task], .sg-task {
    position: absolute;
    border-radius: 2px;

    white-space: nowrap;
    /* overflow: hidden; */

    transition:
        background-color 0.2s,
        opacity 0.2s;
    pointer-events: all;
    /* disable mobile pan/zoom on drag */
    touch-action: none;
  }

  [data-sg-task], .sg-task {
    padding-left: 14px;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  /* .sg-task-content {
    position: absolute;
    height: 100%;
    top: 0;

    padding-left: 14px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    user-select: none;
  } */

  .sg-task.animating:not(.moving),
  .sg-task-sticky:not(.moving) {
    transition:
      left 0.2s,
      top 0.2s,
      transform 0.2s,
      background-color 0.2s,
      width 0.2s,
      height 0.2s;
  }

  .sg-task-sticky > .sg-task-content {
    position: sticky;
    left: 0;
    max-width: 100px;
  }

  .sg-task.moving, [data-moving] {
    z-index: 10000;
    opacity: 0.5;
  }

  .sg-task.resize-enabled:hover::before,
  .sg-task.resize-enabled:hover::after {
    content: '';
    width: 4px;
    height: 50%;
    top: 25%;
    position: absolute;
    border-style: solid;
    border-color: var(--sg-task-resize-color);
    cursor: ew-resize;
    border-width: 0 1px;
    z-index: 1;
  }

  .sg-task.resize-enabled:hover::before {
    margin-left: 3px;
    left: 0;
  }

  .sg-task.resize-enabled:hover::after {
    margin-right: 3px;
    right: 0;
  }

  .sg-task-reflected {
    opacity: 0.5;
  }

  .sg-task-instant {
    width: 2px !important;
    margin-left: -1px;
  }

  :global(.sg-task-default) {
    color: white;
    background: rgb(116, 191, 255);
  }

  :global(.sg-task-default:hover) {
    background: rgb(98, 161, 216);
  }

  :global(.sg-task-default.selected) {
    background: rgb(69, 112, 150);
  }

  :global(.sg-task-selected), [data-sg-task-selected='true'] {
    outline: 2px solid var(--sg-task-selected-outline-color);
    outline-offset: 3px;
    z-index: 1;
  }

  .sg-milestone {
    /* height: 20px; */
    width: 20px !important;
    min-width: 40px;
    margin-left: -20px;
  }

  .sg-task.sg-milestone {
    background: transparent;
  }

  .sg-milestone .sg-milestone__diamond {
    position: relative;
  }

  .sg-milestone .sg-milestone__diamond:before {
    position: absolute;
    top: 0;
    left: 50%;
    content: ' ';
    height: 28px;
    width: 28px;
    transform-origin: 0 0;
    transform: rotate(45deg);
  }

  :global(.sg-milestone__diamond:before) {
    background: rgb(116, 191, 255);
  }
</style>
