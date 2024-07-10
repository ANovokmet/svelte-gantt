<script lang="ts">
    import { getContext } from "svelte";
    import type { SvelteTask } from "../task";
    import { createDraggable } from "./draggable";
    import { scrollIfOutOfBounds } from "../../utils/dom";
    import { onDestroy } from "svelte";

    export let task: SvelteTask;

    let _x: number;
    let _y: number;
    let _width: number;

    const { rowContainer, mainContainer } = getContext('gantt');
    const { resizeHandleWidth } = getContext('options');
    const context = getContext('drag');

    const root = context.rootState;

    $: state = $root[task.model.id];
    $: _dragging = state?.dragging ?? false;
    $: _resizing = state?.resizing ?? false;
    $: _ignoreClick = state?.ignoreClick ?? false;
    $: _state = {
        x: _x,
        y: _y,
        width: _width,
        dragging: _dragging,
        resizing: _resizing,
    }

    $: {
        if (_dragging || _resizing) {
            _x = state?.x ?? task.left;
            _y = state?.y ?? task.top;
            _width = state?.width ?? task.width;
        } else {
            _x = task.left;
            _y = task.top;
            _width = task.width;
        }
    }

    export const dragAllowed: (task: SvelteTask) => boolean = null;
    export const resizeAllowed: (task: SvelteTask) => boolean = null;

    const onPointerDown = createDraggable({
        container: rowContainer,
        resizeHandleWidth,
        getX: () => _x,
        getY: () => _y,
        getWidth: () => _width,
        dragAllowed() {
            const fn = dragAllowed ?? context.dragAllowed ?? (() => true);
            return fn(task);
        },
        resizeAllowed() {
            const fn = resizeAllowed ?? context.resizeAllowed ?? (() => true);
            return fn(task);
        },
        onDown(event) {
            context.save(event, task, event);
        },
        onMouseUp() {
            context.mouseUp(task);
        },
        onResize(event) {
            context.moveAll(event, task, {
                x: event.x,
                y: event.width,
                resizing: true,
                ignoreClick: true,
            });
        },
        onDrag(event) {
            context.moveAll(event, task, {
                x: event.x,
                y: event.y,
                dragging: true,
                ignoreClick: true,
            });
            scrollIfOutOfBounds(event.event, mainContainer);
        },
        onDrop(event) {
            context.dropAll(event);
        }
    });

    onDestroy(() => {
        context.off(task.model.id);
    });
</script>


<slot state={_state} onPointerDown={onPointerDown}/>