<script lang="ts">
    import { getContext } from 'svelte';
    import type { TaskModel, SvelteTask } from '../core/task';
    import { normalizeClassAttr } from '../utils/dom';
    import { isResizable } from '../utils/utils';

    export let model: TaskModel;
    export let height: number;
    export let left: number;
    export let top: number;
    export let width: number;
    export let reflected = false;
    export let animating = true;

    export let dragging = false;
    export let resizing = false;

    const { rowStore } = getContext('dataStore');
    const { taskContent, onTaskButtonClick, taskElementHook } = getContext('options');
    const { selectionManager } = getContext('services');

    const selectedTasks = selectionManager._selectedTasks;

    let _ignoreClick = false;

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

    $: classes = model.classes ? normalizeClassAttr(model.classes) : 'sg-task-default';

    let resizeEnabled: boolean;
    $: {
        const rowModel = $rowStore.entities[model.resourceId].model;
        resizeEnabled = model.type !== 'milestone' && isResizable(rowModel) && isResizable(model);
    }

    let _moving: boolean;
    $: {
        _moving = dragging || resizing;
    }
</script>

<div
    data-task-id={model.id}
    use:taskElement={model}
    class="sg-task {classes}"
    class:sg-milestone={model.type === 'milestone'}
    style="width:{width}px; height:{height}px; left: {left}px; top: {top}px;"
    class:moving={_moving}
    class:animating={animating}
    class:sg-task-reflected={reflected}
    class:sg-task-selected={$selectedTasks[model.id]}
    class:resize-enabled={resizeEnabled}
    class:sg-task--sticky={model.stickyLabel}
    class:sg-ignore-click={_ignoreClick}
    class:sg-task-instant={width === 0}
    on:pointerdown
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
