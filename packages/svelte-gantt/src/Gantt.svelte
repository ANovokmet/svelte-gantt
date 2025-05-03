<script lang="ts">
    import { onMount, setContext, tick } from 'svelte';

    import { GanttBuilder, type GanttProps } from '@svelte-gantt/gantt-core';
    import type { SvelteTask, TaskModel, RowModel, SvelteRow } from '@svelte-gantt/gantt-core';

    let ganttElement: HTMLElement = $state();
    let mounted = $state(false);

    import { ColumnHeader, Columns } from './column';
    import { Row, Task, TimeRange, TimeRangeHeader } from './entities';
    import { Resizer } from './ui';

    import { createGantt } from './gantt';
    import type { MoveEvent } from './modules/create-tasks';
    import { useCreateTask } from './modules/create-tasks';
    import { toValue } from './utils/date';
    import { DefaultSvelteGanttDateAdapter } from './utils/defaultDateAdapter';
    import { createUtils } from './utils/utils';

    function assertSet(values) {
        for (const name in values) {
            if (values[name] == null) {
                throw new Error(`"${name}" is not set`);
            }
        }
    }

    interface Props {
      /** sets top level gantt class which can be used for styling */
      classes?: string | string[];
      /** task content factory function, e.g. (task) => '<div>Custom task content</div>'  */
      taskContent?: any;
      // export until Svelte3 implements Svelte2's setup(component) hook
      ganttTableModules?: any;
      ganttBodyModules?: any;
      /** Allows working with the actual DOM node */
      taskElementHook?: any;
      [key: string]: any;
    }

    let props: GanttProps = $props();

    let {
        rows,
        tasks = [],
        timeRanges = [],
        rowPadding = 6,
        rowHeight = 52,
        from,
        to,
        minWidth = 800,
        fitWidth = false,
        classes = [],
        headers = [
          { unit: 'day', format: 'MMMM Do' },
          { unit: 'hour', format: 'H:mm' }
        ],
        zoomLevels = [
            {
                headers: [
                    { unit: 'day', format: 'DD.MM.YYYY' },
                    { unit: 'hour', format: 'HH' }
                ],
                minWidth: 800,
                fitWidth: true
            },
            {
                headers: [
                    { unit: 'hour', format: 'ddd D/M, H A' },
                    { unit: 'minute', format: 'mm', offset: 15 }
                ],
                minWidth: 5000,
                fitWidth: false
            }
        ],
        taskContent = null,
        tableWidth = 240,
        resizeHandleWidth = 10,
        dateAdapter = new DefaultSvelteGanttDateAdapter(),
        magnetUnit = 'minute',
        magnetOffset = 15,
        columnUnit = 'minute',
        columnOffset = 15,
        ganttTableModules = [],
        ganttBodyModules = [],
        reflectOnParentRows = true,
        reflectOnChildRows = false,
        useCanvasColumns = true,
        columnStrokeColor = '#efefef',
        columnStrokeWidth = 1,
        highlightedDurations = undefined,
        highlightColor = '#6eb859',
        taskElementHook = null,
        enableCreateTask = false,
        onCreateTask = (e: { from: number; to: number; resourceId: PropertyKey; }) => {
            const id: any = `creating-task-${(Math.random() + 1).toString(36).substring(2, 7)}`;
            return ({
                id,
                label: ' ',
                ...e,
            }) as TaskModel;
        },
        onCreatedTask = (task: SvelteTask) => {},
        onRowsChange = (e) => { rows = e; },
        onTasksChange = (e) => { tasks = e; },
        onTimeRangesChange = (e) => { timeRanges = e; },
        ganttState = {},
        onGanttStateChange = (e) => { ganttState = e; },
        viewport = {},
        onViewportChange = (e) => { viewport = e; },
        ...rest
    }: GanttProps = props;
    
    assertSet({ rows });

    const builder = new GanttBuilder(props);
    createGantt(builder);

    assertSet({ from, to });
    let _from = $state(toValue(from));
    let _to = $state(toValue(to));
    $effect(() => {
      _from = toValue(from);
      _to = toValue(to);
    });

    let disableTransition = $state(false);
    async function tickWithoutCSSTransition() {
        disableTransition = true;
        await tick();
        ganttElement.offsetHeight; // force a reflow
        disableTransition = false;
    }

    export const api = builder.api;

    export const timeRangeFactory = new TimeRangeFactory(builder.columnService);

    export const utils = createUtils({
        get from() { return _from },
        get to() { return _to },
        get width() { return builder.width },
        get magnetOffset() { return magnetOffset;},
        get magnetUnit() { return magnetUnit;},
        get magnetDuration() { return builder.magnetDuration();},
        get dateAdapter() { return dateAdapter;},
    });

    const ganttContext: GanttContext = {
        ...store,
        utils,
        api,
        columnService: builder.columnService,
    };
    setContext('gantt', ganttContext);

    let invalidatedTasks: { [taskId: PropertyKey]: boolean; } = $state({});
    let invalidatedRows: { [rowId: PropertyKey]: boolean; } = $state({});
    let invalidateFull = $state(true);
    function invalidatePosition({ task, row }: InvalidatePositionOptions) {
        if (row) {
            invalidatedRows[row.model.id] = true;
            invalidateFull = false;
        }
        if (task) {
            invalidatedTasks[task.model.id] = true;
            invalidatedRows[task.model.resourceId] = true;
            invalidateFull = false;
        }
    }

    onMount(() => {
        mounted = true;
    });

    function onResize(event: { left: number }) {
        tableWidth = event.left;
    }

    function onDateSelected(event: { from: number, to: number }) {
        _from = event.from;
        _to = event.to;
        api['gantt'].raise.dateSelected({ from: _from, to: _to });
    }

    const { createTask, reflectTask }  = createTaskFactory({
        get rowEntities() { return builder.rowStore.entities; },
        get rowPadding() { return rowPadding },
        selection: builder.selection,
        getPositionByDate: (date) => builder.columnService.getPositionByDate(date),
    });


    export function refreshTimeRanges() {
        timeRangeStore.updateRaw(({ ids, entities }) => {
            ids.forEach(id => {
                const timeRange = entities[id];
                const newLeft = builder.columnService.getPositionByDate(timeRange.model.from) | 0;
                const newRight = builder.columnService.getPositionByDate(timeRange.model.to) | 0;

                timeRange.left = newLeft;
                timeRange.width = newRight - newLeft;
            });
            return { ids, entities };
        });
    }

    export function refreshTasks() {
      for (const task of builder.taskStore.all) {
        const newLeft = builder.columnService.getPositionByDate(task.model.from) | 0;
        const newRight = builder.columnService.getPositionByDate(task.model.to) | 0;
        task.left = newLeft;
        task.width = newRight - newLeft;
      }
      builder.taskStore.refresh();
    }

    export function selectTask(id) {
        const task = builder.taskStore.entities[id];
        if (task) {
            builder.selection.select(id);
        }
    }

    export function unselectTasks() {
      builder.selection.clear();
    }


    export function updateTask(model: TaskModel) {
        const task = createTask(model);
        builder.taskStore.upsert(task);
        invalidatePosition({ task });
    }

    export function updateTasks(models: TaskModel[]) {
        const tasks = models.map(model => createTask(model));
        builder.taskStore.upsertAll(tasks);
        tasks.forEach(task => invalidatePosition({ task }));
    }

    export function removeTask(taskId: PropertyKey) {
        const task = builder.taskStore.entities[taskId];
        if (!task) {
            return;
        }
        builder.taskStore.delete(taskId);

        const row = builder.rowStore.entities[task.model.resourceId];
        if (!row) {
            return;
        }
        invalidatePosition({ row });
    }

    export function removeTasks(taskIds: PropertyKey[]) {
        for (const taskId of taskIds) {
            const task = builder.taskStore.entities[taskId];
            if (!task) {
                continue;
            }

            const row = builder.rowStore.entities[task.model.resourceId];
            if (!row) {
                continue;
            }
            invalidatePosition({ row });
        }

        builder.taskStore.deleteAll(taskIds);
    }

    export function updateRow(model: RowModel) {
        // const row = rowFactory.createRows([model], { rowHeight });
        // rowStore.upsertAll(row.rows);
    }

    export function updateRows(models: RowModel[]) {
        // const rows = rowFactory.createRows(models, { rowHeight });
        // rowStore.upsertAll(rows.rows);
    }

    export function getRow(resourceId: PropertyKey): SvelteRow {
        return builder.rowStore.entities[resourceId];
    }

    export function getTask(id) {
        return builder.taskStore.entities[id];
    }

    export function getTasks(resourceId) {
        if (builder.taskStore.rowTaskCache[resourceId]) {
            return builder.taskStore.rowTaskCache[resourceId].map(id => builder.taskStore.entities[id]);
        }
        return null;
    }

    let draggingTasks: { [taskId: PropertyKey]: DraggingState; } = $state({});
    let _creatingTask: SvelteTask = null;
    function onCreateTaskMove({ from, to, x, width, y }: MoveEvent) {
        if (!_creatingTask) {
            // TODO:: incorrect for collapsible rows, if creating under one
            const row = builder.rowStore.all.find(row => row.y < y && y < row.y + row.height);
            const resourceId = row.model.id;
            _creatingTask = createTask(onCreateTask({
                resourceId,
                from,
                to,
            }));
            builder.taskStore.upsert(_creatingTask);
            draggingTasks[_creatingTask.model.id] = {
                x: _creatingTask.left,
                y: _creatingTask.top,
                width: _creatingTask.width,
                resizing: true,
            }
        }

        draggingTasks[_creatingTask.model.id].x = x;
        draggingTasks[_creatingTask.model.id].width = width;
    }

    function onCreateTaskEnd({ from, to, x, width }: MoveEvent) {
        _creatingTask.model.from = from;
        _creatingTask.model.to = to;
        _creatingTask.left = x;
        _creatingTask.width = width;
        builder.taskStore.upsert(_creatingTask);
        delete draggingTasks[_creatingTask.model.id];
        onCreatedTask(_creatingTask);
        _creatingTask = null;
    }

    const dragCreateTasks = useCreateTask();

    function onChange(e: { changes: DragChange[] }) {
        if (e.changes.some(c => !c.targetRow)) {
            return;
        }
        for (const change of e.changes) {
            const { task, current, previous, sourceRow, targetRow } = change;
            if (!targetRow) {
                continue;
            }
            const model = task.model;
            
            if (targetRow) {
                api.tasks.raise.switchRow(task, targetRow, sourceRow);
            }

            const changed = previous.from != current.from || previous.to != current.to || (sourceRow && sourceRow.model.id !== targetRow.model.id);
            if (changed) {
                model.from = current.from;
                model.to = current.to;
                model.resourceId = targetRow.model.id;
                const newTask: SvelteTask = {
                    ...task,
                    left: current.left,
                    top: current.top,
                    width: current.width,
                };

                api.tasks.raise.change({ task: newTask, sourceRow, targetRow, previousState: previous });
                api.tasks.raise.changed({ task: newTask, sourceRow, targetRow, previousState: previous });
                builder.taskStore.update(newTask);
                invalidatePosition({ row: sourceRow });
                invalidatePosition({ task: newTask });
            }
        }
    }

    function onItemsChange(e: { items: { [taskId: PropertyKey]: DraggingState } }) {
        draggingTasks = { ...e.items };
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="sg-gantt {classes}"
    id="sg-gantt-{builder.id}"
    data-sg-gantt={builder.id}
    class:sg-disable-transition={disableTransition}
    bind:this={ganttElement}
    {...builder.elements.root.events}
    style="--sg-header-height:{64}px"
>
    {#each ganttTableModules as module}
    {@const SvelteComponent = module}
      <div class="sg-view" style:flex-basis="{tableWidth}px">
        <SvelteComponent
            {...props} {...rest}
        />
      </div>
      <Resizer x={tableWidth} onResize={onResize} container={ganttElement}></Resizer>
    {/each}

    <div class="sg-timeline sg-view">
        <div class="sg-header" style:padding-right={`${builder.rightScrollbarVisible}px`}  data-sg-scroll-listener="horizontal">
            <div class="sg-header-container" style="width:{builder.width}px">
                {#each builder.columnHeaders as header}
                    <ColumnHeader header={header} />
                {/each}
                {#each builder.timeRangeStore.all as timeRange (timeRange.model.id)}
                    <TimeRangeHeader {timeRange} />
                {/each}
            </div>
        </div>

        <!-- TODO:: these are good measurements but this element does not resize so svelte+resizeobsever do not catch changes, ive never observed this because you need to have expandable rows -->
        <div
            class="sg-timeline-body"
            data-sg-timeline-body
            data-sg-main-container
            use:dragCreateTasks={{ container: null, enabled: enableCreateTask, onMove: onCreateTaskMove, onEnd: onCreateTaskEnd, boundsContainer: null }}
            {...builder.elements.body.events}
        >
            <div class="content" style="width:{builder.width}px">
                <Columns columns={builder.columns} {columnStrokeColor} {columnStrokeWidth} {useCanvasColumns} />

                <div
                    class="sg-rows"
                    data-sg-row-container
                    style="height:{builder.virtual.totalHeight}px;"
                >
                    <div style="transform: translateY({builder.virtual.virtualOffset}px);">
                        {#each builder.visibleRowBuilders as row (row.row.id)}
                            <Row builder={row} />
                        {/each}
                    </div>
                </div>

                <div class="sg-foreground">
                    {#each builder.timeRangeStore.all as timeRange (timeRange.model.id)}
                        <TimeRange {timeRange} />
                    {/each}

                    {#each builder.visibleTasks as task (task.model.id)}
                        <Task {...task} />
                    {/each}
                </div>
                {#each ganttBodyModules as module}
                    {@const SvelteComponent_1 = module}
                    <SvelteComponent_1
                        {...props}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    :global(.sg-gantt) {
        --sg-column-header-bg-hover: #f9f9f9;
        --sg-column-border-color: #efefef;
        --sg-column-header-border-color: #efefef;
        --sg-table-cell-border-color: #efefef;
        --sg-table-header-cell-border-color: #efefef;
        --sg-table-header-cell-bg: #fbfbfb;
        --sg-resize-color: #e9eaeb;
        --sg-dependency-arrow-color: #64748b;
        --sg-task-resize-color: rgba(255, 255, 255, 0.5);
        --sg-task-selected-outline-color: rgba(3, 169, 244, 0.5);
/* 
        --sg-column-header-bg-hover: #333;
        --sg-column-border-color: #333;
        --sg-column-header-border-color: #333;
        --sg-table-cell-border-color: #333;
        --sg-table-header-cell-border-color: #333;
        --sg-table-header-cell-bg: #333;
        --sg-resize-color: #333;
        --sg-dependency-arrow-color: red;
        --sg-task-resize-color: #ccc; */
    }

    .sg-disable-transition :global(.sg-task),
    .sg-disable-transition :global(.sg-milestone) {
        transition:
            transform 0s,
            background-color 0.2s,
            width 0s !important;
    }

    :global(.sg-view:not(:first-child)) {
        margin-left: 5px;
    }

    .sg-timeline {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        overflow-x: auto;
    }

    .sg-gantt {
        display: flex;

        width: 100%;
        height: 100%;
        position: relative;
    }

    .sg-foreground {
        box-sizing: border-box;
        overflow: hidden;
        top: 0;
        left: 0;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
    }

    .sg-rows {
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .sg-timeline-body {
        overflow: auto;
        flex: 1 1 0;
    }

    .sg-header {
      height: var(--sg-header-height);

      overflow: hidden;
        position: relative;
    }

    .sg-header-scroller {
        /* border-right: 1px solid #efefef; // replace with element, or conditionally draw this border */
        overflow: hidden;
        position: relative;
        height: 100%;
    }

    .content {
        position: relative;
    }

    :global(*) {
        box-sizing: border-box;
    }

    .sg-header-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
</style>
