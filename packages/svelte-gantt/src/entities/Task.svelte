<script lang="ts">
    import { getContext } from 'svelte';
    import type { TaskModel, SvelteTask } from '../core/task';
    import { normalizeClassAttr, setCursor, throttle } from '../utils/dom';
    import { useDraggable } from '../core/drag';
    import type { DownDropEvent } from '../core/drag';

    export let model: TaskModel;
    export let height: number;
    export let left: number;
    export let top: number;
    export let width: number;
    export let reflected = false;

    let animating = true;
    let _dragging = false;
    let _resizing = false;

    let _position = {
        x: left,
        y: top,
        width: width
    };

    $: {
        updatePosition(left, top, width);
    }

    function updatePosition(x, y, width) {
        if (!_dragging && !_resizing) {
            _position.x = x;
            _position.y = y;
            _position.width = width;
            // should NOT animate on resize/update of columns
        }
    }

    const { taskStore, rowStore, draggingTaskCache } = getContext('dataStore');
    const { rowContainer, mainContainer, invalidatePosition } = getContext('gantt');
    const {
        taskContent,
        resizeHandleWidth,
        rowPadding,
        onTaskButtonClick,
        taskElementHook,
    } = getContext('options');
    const { dndManager, api, utils, columnService, selectionManager } = getContext('services');
    const draggingContext = getContext('drag');
    const draggingActive = draggingContext.active;
    const draggingTasks = draggingContext.dragging;

    let selectedTasks = selectionManager._selectedTasks;

    /** How much pixels near the bounds user has to drag to start scrolling */
    const DRAGGING_TO_SCROLL_TRESHOLD = 40;
    /** How much pixels does the view scroll when dragging */
    const DRAGGING_TO_SCROLL_DELTA = 40;
    /** Bounds of the main gantt area, changes only on window resize */
    let mainContainerRect: DOMRect;
    function outOfBounds(event: MouseEvent, rect: DOMRect) {
        return {
            left: event.clientX - rect.left < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
            top: event.clientY - rect.top < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
            right: event.clientX - rect.left > rect.width - DRAGGING_TO_SCROLL_TRESHOLD,
            bottom: event.clientY - rect.top > rect.height - DRAGGING_TO_SCROLL_TRESHOLD
        };
    }

    const scrollIfOutOfBounds = throttle((event: MouseEvent) => {
        // throttle the following
        const bounds = outOfBounds(event, mainContainerRect);
        if (bounds.left || bounds.right) {
            // scroll left
            mainContainer.scrollTo({
                left:
                    mainContainer.scrollLeft +
                    (bounds.left ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
                behavior: 'smooth'
            });
        }

        if (bounds.top || bounds.bottom) {
            // scroll top
            mainContainer.scrollTo({
                top:
                    mainContainer.scrollTop +
                    (bounds.top ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
                behavior: 'smooth'
            });
        }
    }, 250);

    let _ignoreClick = false;
    function drag(node: HTMLElement) {
        // reflected tasks must not be resized or dragged
        if (reflected) {
            return;
        }

        draggingContext.on(model.id, {
            move(event) {
                _position = {
                    x: event.x != null ? event.x : _position.x,
                    y: event.y != null ? event.y : _position.y,
                    width: event.width != null ? event.width : _position.width,
                };
            },
            drop(event) {
                onDrop(event);
            }
        });

        function onDrop(event: DownDropEvent) {
            let rowChangeValid = true;
            const previousState = {
                id: model.id,
                resourceId: model.resourceId,
                from: model.from,
                to: model.to
            };
            const task = $taskStore.entities[model.id];

            //row switching
            const sourceRow = $rowStore.entities[model.resourceId];
            if (event.dragging) {
                const targetRow = dndManager.getTarget('row', event.mouseEvent);
                if (targetRow) {
                    model.resourceId = targetRow.model.id;
                    api.tasks.raise.switchRow(task, targetRow, sourceRow);
                } else {
                    rowChangeValid = false;
                }
            }

            _dragging = _resizing = false;
            setTimeout(() => { // because we want to block delegated clicks on gantt after dragging
                _ignoreClick = false;
            });

            delete $draggingTaskCache[model.id];

            if (!rowChangeValid) {
                // reset position
                _position.x = task.left;
                _position.width = task.width;
                _position.y = task.top;
                return;
            }

            const prevFrom = model.from;
            const prevTo = model.to;
            const newFrom = (model.from = utils.roundTo(columnService.getDateByPosition(event.x)));
            const newTo = (model.to = utils.roundTo(columnService.getDateByPosition(event.x + event.width)));
            const newLeft = columnService.getPositionByDate(newFrom) | 0;
            const newRight = columnService.getPositionByDate(newTo) | 0;

            const targetRow = $rowStore.entities[model.resourceId];
            const left = newLeft;
            const width = newRight - newLeft;
            const top = $rowPadding + targetRow.y;
            // get value of top from the layout

            updatePosition(left, task.top, width);

            const newTask = {
                ...task,
                left: left,
                width: width,
                // top: top,
                model
            };

            const changed =
                prevFrom != newFrom ||
                prevTo != newTo ||
                (sourceRow && sourceRow.model.id !== targetRow.model.id);
            if (changed) {
                api.tasks.raise.change({ task: newTask, sourceRow, targetRow, previousState });
            }

            if (changed) {
                api.tasks.raise.changed({ task: newTask, sourceRow, targetRow, previousState });
            }
            taskStore.update(newTask);
            invalidatePosition({ row: sourceRow });
            invalidatePosition({ task: newTask });
        }

        const draggable = useDraggable(node, {
            container: rowContainer,
            resizeHandleWidth,
            getX: () => _position.x,
            getY: () => _position.y,
            getWidth: () => _position.width,
            dragAllowed() {
                return (
                    $rowStore.entities[model.resourceId].model.enableDragging &&
                    model.enableDragging
                );
            },
            resizeAllowed() {
                return (
                    model.type !== 'milestone' &&
                    $rowStore.entities[model.resourceId].model.enableResize &&
                    model.enableResize
                );
            },
            onDown(event) {
                const { mouseEvent } = event;
                let draggingTasks: SvelteTask[] = [];
                if (mouseEvent.ctrlKey) {
                    for (const [taskId, isSelected] of Object.entries($selectedTasks)) {
                        if (isSelected && taskId !== String(model.id)) {
                            draggingTasks.push($taskStore.entities[taskId]);
                        }
                    }
                }

                draggingContext.save(event, draggingTasks);

                mainContainerRect = mainContainer.getBoundingClientRect();
                if (event.dragging) {
                    setCursor('move');
                }
                if (event.resizing) {
                    setCursor('e-resize');
                }
                $draggingTaskCache[model.id] = true;
            },
            onMouseUp() {
                setCursor('default');
                api.tasks.raise.moveEnd(model);
                delete $draggingTaskCache[model.id];
            },
            onResize(event) {
                _position.x = event.x;
                _position.width = event.width;
                _resizing = true;
                _ignoreClick = true;
                draggingContext.moveAll(event);
                scrollIfOutOfBounds(event.event);
            },
            onDrag(event) {
                _position.x = event.x;
                _position.y = event.y;
                _dragging = true;
                _ignoreClick = true;
                api.tasks.raise.move(model);
                draggingContext.moveAll(event);
                scrollIfOutOfBounds(event.event);
            },
            onDrop(event) {
                if (event.dragging || event.resizing) {
                    onDrop(event);
                    draggingContext.dropAll(event);
                }
            }
        });

        return {
            destroy: () => {
                draggingContext.off(model.id);
                draggable.destroy();
            }
        };
    }

    function taskElement(node, model) {
        if (taskElementHook) {
            return taskElementHook(node, model);
        }
    }

    function onClick(event: MouseEvent) {
        if (onTaskButtonClick) {
            onTaskButtonClick(model, event);
        }
    }

    let classes;
    $: {
        classes = model.classes ? normalizeClassAttr(model.classes) : 'sg-task-default';
    }

    let resizeEnabled: boolean;
    $: {
        resizeEnabled =
            model.type !== 'milestone' &&
            $rowStore.entities[model.resourceId].model.enableResize &&
            model.enableResize;
    }

    let _top: number;
    $: {
        _top = _position.y;
    }

    let _moving: boolean;
    $: {
        _moving = _dragging || _resizing || ($draggingTasks[model.id] && $draggingActive);
    }

    let _animating: boolean;
    $: {
        _animating = animating && !$draggingTaskCache[model.id];
    }
</script>

<div
    data-task-id={model.id}
    use:drag
    use:taskElement={model}
    class="sg-task {classes}"
    class:sg-milestone={model.type === 'milestone'}
    style="width:{_position.width}px; height:{height}px; left: {_position.x}px; top: {_top}px;"
    class:moving={_moving}
    class:animating={_animating}
    class:sg-task-reflected={reflected}
    class:sg-task-selected={$selectedTasks[model.id]}
    class:resize-enabled={resizeEnabled}
    class:sg-task--sticky={model.stickyLabel}
    class:sg-ignore-click={_ignoreClick}
    class:sg-task-instant={_position.width === 0}
>
    {#if model.type === 'milestone'}
        <div class="sg-milestone__diamond"></div>
    {/if}
    {#if model.amountDone}
        <div class="sg-task-background" style="width:{model.amountDone}%" />
    {/if}
    <div class="sg-task-content">
        {#if model.html}
            {@html model.html}
        {:else if taskContent}
            {@html taskContent(model)}
        {:else}
            {model.label}
        {/if}
        {#if model.showButton}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span
                class="sg-task-button {model.buttonClasses}"
                on:click={onClick}
                role="button"
                tabindex="0"
            >
                {@html model.buttonHtml}
            </span>
        {/if}
    </div>

    {#if model.labelBottom}
        <span class="sg-label-bottom">{model.labelBottom}</span>
    {/if}
</div>

<style>
    .sg-label-bottom {
        position: absolute;
        top: calc(100% + 10px);
        color: #888;
    }

    .debug {
        position: absolute;
        top: -10px;
        right: 0;
        font-size: 8px;
        color: black;
    }

    .sg-task {
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

    .sg-task-background {
        position: absolute;
        height: 100%;
        top: 0;
    }

    .sg-task-content {
        position: absolute;
        height: 100%;
        top: 0;

        padding-left: 14px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        user-select: none;
    }

    .sg-task.animating:not(.moving) {
        transition:
            left 0.2s,
            top 0.2s,
            transform 0.2s,
            background-color 0.2s,
            width 0.2s,
            height 0.2s;
    }

    .sg-task--sticky:not(.moving) {
        transition:
            left 0.2s,
            top 0.2s,
            transform 0.2s,
            background-color 0.2s,
            width 0.2s,
            height 0.2s;
    }

    .sg-task--sticky > .sg-task-content {
        position: sticky;
        left: 0;
        max-width: 100px;
    }

    .sg-task.moving {
        z-index: 10000;
        opacity: 0.5;
    }

    .sg-task.resize-enabled:hover::before {
        content: '';
        width: 4px;
        height: 50%;
        top: 25%;
        position: absolute;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.5);
        cursor: ew-resize;
        margin-left: 3px;
        left: 0;
        border-width: 0 1px;
        z-index: 1;
    }

    .sg-task.resize-enabled:hover::after {
        content: '';
        width: 4px;
        height: 50%;
        top: 25%;
        position: absolute;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.5);
        cursor: ew-resize;
        margin-right: 3px;
        right: 0;
        border-width: 0 1px;
        z-index: 1;
    }

    .sg-task-reflected {
        opacity: 0.5;
    }

    .sg-task-instant {
        width: 2px !important;
        margin-left: -1px;
    }

    .sg-task-background {
        background: rgba(0, 0, 0, 0.2);
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

    :global(.sg-task-selected) {
        outline: 2px solid rgba(3, 169, 244, 0.5);
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
