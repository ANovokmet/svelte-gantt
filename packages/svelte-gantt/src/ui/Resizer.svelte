<script lang="ts">
    import { useDraggable } from '../core/drag';
    import { setCursor } from '../utils/dom';

    type Props = {
      x: number;
      container: HTMLElement;
      onResize(event: { left: number; });
    }

    let { x = $bindable(), container, onResize }: Props = $props();

    let dragging = false;
    const dragOptions = $state({
        onDrag: event => {
            (x = event.x), (dragging = true);
            onResize({ left: x });
            setCursor('col-resize');
        },
        onDrop: event => {
            (x = event.x), (dragging = false);
            onResize({ left: x });
            setCursor('default');
        },
        dragAllowed: true,
        resizeAllowed: false,
        container: container,
        getX: () => x,
        getY: () => 0,
        getWidth: () => 0
    });

    $effect(() => {
        dragOptions.container = container;
    });

    function resizer(node: HTMLElement) {
        const draggable = useDraggable(node, dragOptions);

        return { destroy: () => draggable.destroy() };
    }
</script>

<div class="sg-resize" style="left:{x}px" use:resizer></div>

<style>
    .sg-resize {
        z-index: 2;
        background: var(--sg-resize-color);
        width: 5px;
        cursor: col-resize;
        position: absolute;
        height: 100%;

        transition:
            width 0.2s,
            transform 0.2s;
    }

    .sg-resize:hover {
        transform: translateX(-2px);
        width: 10px;
    }
</style>
