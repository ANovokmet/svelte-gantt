<script lang="ts">
    import { onMount, setContext, tick, onDestroy } from 'svelte';
    import { writable, derived } from 'svelte/store';

    let ganttElement: HTMLElement;
    let mainHeaderContainer: HTMLElement;
    let mainContainer;
    let rowContainer: HTMLElement;
    let scrollables = [];
    let mounted = false;

    import { createDataStore } from './core/store';
    import { Task, Row, TimeRange, TimeRangeHeader } from './entities';
    import { Columns, ColumnHeader } from './column';
    import { Resizer } from './ui';

    import { createUtils, getIndicesOnly, getPositionByDate } from './utils/utils';
    import { getRelativePos, isLeftClick } from './utils/dom';
    import { provideGanttApi } from './core/api';
    import { createTaskFactory } from './core/task';
    import type { SvelteTask, TaskModel } from './core/task';
    import { collapseRow, expandRow, createRows } from './core/row';
    import type { RowModel, SvelteRow } from './core/row';
    import { TimeRangeFactory } from './core/timeRange';
    import { DragDropManager, DraggableGroup } from './core/drag';
    import { SelectionManager } from './core/selectionManager';
    import { createColumnService } from './core/column';
    import type { HighlightedDurations, Column as IColumn } from './core/column';
    import { createDelegatedEventDispatcher } from './core/events';
    import { getDuration, getAllPeriods } from './utils/date';
    import { DefaultSvelteGanttDateAdapter } from './utils/defaultDateAdapter';
    import type { SvelteGanttDateAdapter } from './utils/date';
    import * as layouts from './core/layouts';
    import { useCreateTask } from './modules/create-tasks';
    import type { MoveEvent } from './modules/create-tasks';
    import type { GanttContext, InvalidatePositionOptions } from './gantt';
    import Draggable from './core/drag/Draggable.svelte';
    import type { DragChange, State as DraggingState } from './core/drag/DragContext';

    function assertSet(values) {
        for (const name in values) {
            if (values[name] == null) {
                throw new Error(`"${name}" is not set`);
            }
        }
    }

    export let rows: RowModel[];
    export let tasks: TaskModel[] = [];
    export let timeRanges = [];

    assertSet({ rows });
    $: if (mounted) initRows(rows);
    $: if (mounted) initTasks(tasks);
    $: if (mounted) initTimeRanges(timeRanges);

    export let rowPadding = 6;
    export let rowHeight = 52;
    const _rowHeight = writable(rowHeight);
    const _rowPadding = writable(rowPadding);
    $: $_rowHeight = rowHeight;
    $: $_rowPadding = rowPadding;

    function toDateNum(date: number | Date) {
        return date instanceof Date ? date.valueOf() : date;
    }

    export let from;
    export let to;
    assertSet({ from, to });
    const _from = writable(toDateNum(from));
    const _to = writable(toDateNum(to));
    $: $_from = toDateNum(from);
    $: $_to = toDateNum(to);

    export let minWidth = 800;
    export let fitWidth = false;
    const _minWidth = writable(minWidth);
    const _fitWidth = writable(fitWidth);
    $: {
        $_minWidth = minWidth;
        $_fitWidth = fitWidth;
    }

    export let classes = [];
    export let headers = [
        { unit: 'day', format: 'MMMM Do' },
        { unit: 'hour', format: 'H:mm' }
    ];
    export let zoomLevels = [
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
    ];
    export let taskContent = null;
    export let tableWidth = 240;
    export let resizeHandleWidth = 10;
    export let onTaskButtonClick = null;

    export let dateAdapter: SvelteGanttDateAdapter = new DefaultSvelteGanttDateAdapter();

    export let magnetUnit = 'minute';
    export let magnetOffset = 15;
    let magnetDuration: number;
    $: setMagnetDuration(magnetUnit, magnetOffset);
    setMagnetDuration(magnetUnit, magnetOffset);

    function setMagnetDuration(unit, offset) {
        if (unit && offset) {
            magnetDuration = getDuration(unit, offset);
        }
    }

    export let columnUnit = 'minute';
    export let columnOffset = 15;

    // export until Svelte3 implements Svelte2's setup(component) hook
    export let ganttTableModules = [];
    export let ganttBodyModules = [];

    export let reflectOnParentRows = true;
    export let reflectOnChildRows = false;

    /**
     * Render columns in a canvas, results in a better performance.
     * Set to false if advanced CSS styling is needed.
     **/
    export let useCanvasColumns = true;
    export let columnStrokeColor = '#efefef';
    export let columnStrokeWidth = 1;

    export let highlightedDurations: HighlightedDurations;
    export let highlightColor = '#6eb859';

    /** Allows working with the actual DOM node */
    export let taskElementHook = null;

    /** Controls how the tasks will render */
    export let layout: 'overlap' | 'pack' | 'expand' = 'overlap';
    const _layout = writable(layout);
    $: $_layout = layout;

    const visibleWidth = writable<number>(null);
    const visibleHeight = writable<number>(null);
    const headerHeight = writable<number>(null);
    const _width = derived([visibleWidth, _minWidth, _fitWidth], ([visible, min, stretch]) => {
        return stretch && visible > min ? visible : min;
    });

    const dataStore = createDataStore();
    setContext('dataStore', dataStore);
    const {
        rowStore,
        taskStore,
        timeRangeStore,
        allTasks,
        allRows,
        allTimeRanges,
        rowTaskCache
    } = dataStore;

    export const columnService = createColumnService({
        get columns() { return columns },
        get magnetDuration() { return magnetDuration },
    });

    let disableTransition = false;

    async function tickWithoutCSSTransition() {
        disableTransition = true;
        await tick();
        ganttElement.offsetHeight; // force a reflow
        disableTransition = false;
    }

    let columns: IColumn[];
    $: {
        columns = getColumnsV2($_from, $_to, columnUnit, columnOffset, $_width);
        tickWithoutCSSTransition();
        refreshTimeRanges();
        refreshTasks();
    }

    function getColumnsV2(
        from: number | Date,
        to: number | Date,
        unit: string,
        offset: number,
        width: number
    ): IColumn[] {
        //BUG: Function is running twice on init, how to prevent it?

        if (from instanceof Date) from = from.valueOf();
        if (to instanceof Date) to = to.valueOf();

        let cols = [];
        const periods = getAllPeriods(
            from.valueOf(),
            to.valueOf(),
            unit,
            offset,
            highlightedDurations
        );
        let left = 0;
        let distance_point = 0;
        periods.forEach(function (period) {
            left = distance_point;
            distance_point = getPositionByDate(period.to, $_from, $_to, $_width);
            cols.push({
                width: distance_point - left,
                from: period.from,
                to: period.to,
                left: left,
                duration: period.duration,
                ...(period.isHighlighted && { bgHighlightColor: highlightColor })
            });
        });
        return cols;
    }

    let offsetWidth: number;
    let offsetHeight: number;
    let bottomScrollbarVisible = writable(offsetHeight - $visibleHeight);
    let rightScrollbarVisible = writable(offsetWidth - $visibleWidth);
    $: $bottomScrollbarVisible = offsetHeight - $visibleHeight;
    $: $rightScrollbarVisible = offsetWidth - $visibleWidth;

    setContext('dimensions', {
        from: _from,
        to: _to,
        width: _width,
        visibleWidth,
        visibleHeight,
        headerHeight,
        bottomScrollbarVisible,
        rightScrollbarVisible,
    });

    setContext('options', {
        dateAdapter,
        taskElementHook,
        taskContent,
        rowPadding: _rowPadding,
        rowHeight: _rowHeight,
        layout: _layout,
        resizeHandleWidth: resizeHandleWidth,
        reflectOnParentRows,
        reflectOnChildRows,
        onTaskButtonClick
    });

    const hoveredRow = writable<number | string>(null);
    const selectedRow = writable<number | string>(null);

    const ganttContext: GanttContext = {
        rowContainer: null,
        mainContainer: null,
        mainHeaderContainer: null,
        scrollables,
        hoveredRow,
        selectedRow,
        updateLayout,
        expandRow(row) {
            expandRow(row);
            updateLayout();
        },
        collapseRow(row) {
            collapseRow(row);
            updateLayout();
        },
        invalidatePosition,
    };
    setContext('gantt', ganttContext);

    let invalidatedTasks: { [taskId: PropertyKey]: boolean; } = {};
    let invalidatedRows: { [rowId: PropertyKey]: boolean; } = {};
    let invalidateFull = true;
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
        Object.assign(ganttContext, {
            rowContainer,
            mainContainer,
            mainHeaderContainer
        });
        mounted = true;
    });

    const { onDelegatedEvent, offDelegatedEvent, onEvent } = createDelegatedEventDispatcher();

    onDelegatedEvent('click', 'data-task-id', (event, data, target) => {
        const taskId = data;
        const task = $taskStore.entities[taskId];
        if (isLeftClick(event) && !target.classList.contains('sg-task-reflected') && !target.classList.contains('sg-ignore-click')) {
            if (event.ctrlKey) {
                selectionManager.toggleSelection(taskId);
            } else {
                selectionManager.selectSingle(taskId);
            }
        }
        api['tasks'].raise.select(task);
    });

    onDelegatedEvent('pointerover', 'data-row-id', (event, data, target) => {
        $hoveredRow = data;
    });

    onDelegatedEvent('click', 'data-row-id', (event, data, target) => {
        selectionManager.unSelectTasks();
        if ($selectedRow == data) {
            $selectedRow = null;
            return;
        }
        $selectedRow = data;
    });

    onDelegatedEvent('dblclick', 'data-task-id', (event, data, target) => {
        const taskId = data;
        api['tasks'].raise.dblclicked($taskStore.entities[taskId], event);
    });

    onDelegatedEvent('pointerleave', 'empty', (event, data, target) => {
        $hoveredRow = null;
    });

    onDestroy(() => {
        offDelegatedEvent('click', 'data-task-id');
        offDelegatedEvent('click', 'data-row-id');
        offDelegatedEvent('dblclick', 'data-task-id');

        selectionManager.unSelectTasks();
    });

    let __scrollTop = 0;
    let __scrollLeft = 0;
    function scrollable(node) {
        const onscroll = event => {
            const { scrollTop, scrollLeft } = node;

            scrollables.forEach(scrollable => {
                if (scrollable.orientation === 'horizontal') {
                    scrollable.node.scrollLeft = scrollLeft;
                } else {
                    scrollable.node.scrollTop = scrollTop;
                }
            });

            __scrollTop = scrollTop;
            __scrollLeft = scrollLeft;
        };

        node.addEventListener('scroll', onscroll);
        return {
            destroy() {
                node.removeEventListener('scroll', onscroll, false);
            }
        };
    }

    function horizontalScrollListener(node) {
        scrollables.push({ node, orientation: 'horizontal' });
    }

    function onResize(event) {
        tableWidth = event.detail.left;
    }

    let zoomLevel = 0;
    let zooming = false;
    async function onwheel(event: WheelEvent) {
        if (event.ctrlKey) {
            event.preventDefault();

            const prevZoomLevel = zoomLevel;
            if (event.deltaY > 0) {
                zoomLevel = Math.max(zoomLevel - 1, 0);
            } else {
                zoomLevel = Math.min(zoomLevel + 1, zoomLevels.length - 1);
            }

            if (prevZoomLevel != zoomLevel && zoomLevels[zoomLevel]) {
                const options = {
                    columnUnit: columnUnit,
                    columnOffset: columnOffset,
                    minWidth: $_minWidth,
                    ...zoomLevels[zoomLevel]
                };

                const scale = options.minWidth / $_width;
                const node = mainContainer;
                const mousepos = getRelativePos(node, event);
                const before = node.scrollLeft + mousepos.x;
                const after = before * scale;
                const scrollLeft = after - mousepos.x + node.clientWidth / 2;

                columnUnit = options.columnUnit;
                columnOffset = options.columnOffset;
                $_minWidth = options.minWidth;

                if (options.headers) headers = options.headers;

                if (options.fitWidth) $_fitWidth = options.fitWidth;

                api['gantt'].raise.viewChanged();
                zooming = true;
                await tick();
                node.scrollLeft = scrollLeft;
                zooming = false;
            }
        }
    }

    function onDateSelected(event) {
        $_from = event.detail.from;
        $_to = event.detail.to;
        api['gantt'].raise.dateSelected({ from: $_from, to: $_to });
    }

    function initRows(rowsData) {
        //Bug: Running twice on change options
        const rows = createRows(rowsData, { rowHeight });
        rowStore.addAll(rows);
        updateLayout();
    }

    const { createTask, reflectTask } = createTaskFactory({
        get rowEntities() { return $rowStore.entities; },
        get rowPadding() { return rowPadding },
        getPositionByDate: (date) => columnService.getPositionByDate(date),
    });

    async function initTasks(taskData: TaskModel[]) {
        const tasks = [];
        for (const taskModel of taskData) {
            if (!draggingTasks[taskModel.id]) {
                delete draggingTasks[taskModel.id];
            }
            const task = createTask(taskModel);
            tasks.push(task);
        }
        taskStore.addAll(tasks);
        updateLayout();
    }

    let _reflectedTasksCache: { [rowId: PropertyKey]: SvelteTask[] } = {};
    $: {
        _reflectedTasksCache = {};
        for (const task of $allTasks) {
            const row = $rowStore.entities[task.model.resourceId];
            if (!row) {
                continue;
            }

            if (reflectOnChildRows && row.allChildren) {
                row.allChildren.forEach(r => {
                    const reflectedTask = reflectTask(task, r);
                    if (!_reflectedTasksCache[r.model.id]) {
                        _reflectedTasksCache[r.model.id] = [];
                    }
                    _reflectedTasksCache[r.model.id].push(reflectedTask);
                });
            }

            if (reflectOnParentRows && row.allParents) {
                row.allParents.forEach(r => {
                    const reflectedTask = reflectTask(task, r);
                    if (!_reflectedTasksCache[r.model.id]) {
                        _reflectedTasksCache[r.model.id] = [];
                    }
                    _reflectedTasksCache[r.model.id].push(reflectedTask);
                });
            }
        }
    }

    function initTimeRanges(timeRangeData) {
        const timeRanges = timeRangeData.map(timeRange => {
            return timeRangeFactory.create(timeRange);
        });
        timeRangeStore.addAll(timeRanges);
    }

    export const api = provideGanttApi();
    const selectionManager = new SelectionManager(taskStore);

    export const dndManager = new DragDropManager(rowStore);
    export const timeRangeFactory = new TimeRangeFactory(columnService);

    export const utils = createUtils({
        get from() { return $_from },
        get to() { return $_to },
        get width() { return $_width },
        get magnetOffset() { return  magnetOffset;},
        get magnetUnit() { return magnetUnit;},
        get magnetDuration() { return  magnetDuration;},
        get dateAdapter() { return  dateAdapter;},
    });

    setContext('services', {
        utils,
        api,
        dndManager,
        selectionManager,
        columnService,
    });

    export function refreshTimeRanges() {
        timeRangeStore._update(({ ids, entities }) => {
            ids.forEach(id => {
                const timeRange = entities[id];
                const newLeft = columnService.getPositionByDate(timeRange.model.from) | 0;
                const newRight = columnService.getPositionByDate(timeRange.model.to) | 0;

                timeRange.left = newLeft;
                timeRange.width = newRight - newLeft;
            });
            return { ids, entities };
        });
    }

    export function refreshTasks() {
        $allTasks.forEach(task => {
            const newLeft = columnService.getPositionByDate(task.model.from) | 0;
            const newRight = columnService.getPositionByDate(task.model.to) | 0;

            task.left = newLeft;
            task.width = newRight - newLeft;
        });
        taskStore.refresh();
    }

    export function getRowContainer() {
        return rowContainer;
    }

    export function selectTask(id) {
        const task = $taskStore.entities[id];
        if (task) {
            selectionManager.selectSingle(id);
        }
    }

    export function unselectTasks() {
        selectionManager.unSelectTasks();
    }

    export function scrollToRow(id, scrollBehavior = 'auto') {
        const { scrollTop, clientHeight } = mainContainer;
        const row = $rowStore.entities[id];
        if (!row) {
            return;
        }
        const targetTop = row.y;

        if (targetTop < scrollTop) {
            mainContainer.scrollTo({
                top: targetTop,
                behavior: scrollBehavior
            });
        }

        if (targetTop > scrollTop + clientHeight) {
            mainContainer.scrollTo({
                top: targetTop + row.height - clientHeight,
                behavior: scrollBehavior
            });
        }
    }

    export function scrollToTask(id, scrollBehavior = 'auto') {
        const { scrollLeft, scrollTop, clientWidth, clientHeight } = mainContainer;

        const task = $taskStore.entities[id];
        if (!task) return;
        const row = $rowStore.entities[task.model.resourceId];
        const targetLeft = task.left;
        const targetTop = row.y;

        const options = {
            top: undefined,
            left: undefined,
            behavior: scrollBehavior
        };

        if (targetLeft < scrollLeft) {
            options.left = targetLeft;
        }

        if (targetLeft > scrollLeft + clientWidth) {
            options.left = targetLeft + task.width - clientWidth;
        }

        if (targetTop < scrollTop) {
            options.top = targetTop;
        }

        if (targetTop > scrollTop + clientHeight) {
            options.top = targetTop + row.height - clientHeight;
        }

        mainContainer.scrollTo(options);
    }

    export function updateTask(model: TaskModel) {
        const task = createTask(model);
        taskStore.upsert(task);
        invalidatePosition({ task });
        updateLayoutSync();
    }

    export function updateTasks(models: TaskModel[]) {
        const tasks = models.map(model => createTask(model));
        taskStore.upsertAll(tasks);
        tasks.forEach(task => invalidatePosition({ task }));
        updateLayoutSync();
    }

    export function removeTask(taskId: PropertyKey) {
        const task = $taskStore.entities[taskId];
        if (!task) {
            return;
        }
        taskStore.delete(taskId);

        const row = $rowStore.entities[task.model.resourceId];
        if (!row) {
            return;
        }
        invalidatePosition({ row });
        updateLayoutSync();
    }

    export function removeTasks(taskIds: PropertyKey[]) {
        for (const taskId of taskIds) {
            const task = $taskStore.entities[taskId];
            if (!task) {
                continue;
            }

            const row = $rowStore.entities[task.model.resourceId];
            if (!row) {
                continue;
            }
            invalidatePosition({ row });
        }

        taskStore.deleteAll(taskIds);
        updateLayoutSync();
    }

    export function updateRow(model: RowModel) {
        const row = createRows([model], { rowHeight });
        rowStore.upsertAll(row);
        updateLayout();
        updateLayoutSync();
    }

    export function updateRows(models: RowModel[]) {
        const rows = createRows(models, { rowHeight });
        rowStore.upsertAll(rows);
        updateLayout();
        updateLayoutSync();
    }

    export function getRow(resourceId) {
        return $rowStore.entities[resourceId];
    }

    export function getTask(id) {
        return $taskStore.entities[id];
    }

    export function getTasks(resourceId) {
        if ($rowTaskCache[resourceId]) {
            return $rowTaskCache[resourceId].map(id => $taskStore.entities[id]);
        }
        return null;
    }

    let filteredRows: SvelteRow[] = [];
    let rowsAreOfSameHeight = true;
    let rowContainerHeight = 0;
    $: {
        filteredRows = [];
        rowContainerHeight = 0;
        layoutChanged;
        const firstRow = $allRows[0];
        for (const row of $allRows) {
            if (!row.hidden) {
                filteredRows.push(row);

                if (firstRow && firstRow.height !== row.height) {
                    rowsAreOfSameHeight = false;
                }

                rowContainerHeight += row.height || rowHeight;
            }
        }
    }

    let startIndex;
    $: {
        if (rowsAreOfSameHeight) {
            startIndex = Math.floor(__scrollTop / rowHeight);
        } else {
            startIndex = getIndicesOnly(filteredRows, __scrollTop, row => row.y)[0];
        }
    }

    let endIndex;
    $: {
        if (rowsAreOfSameHeight) {
            endIndex = Math.min(startIndex + Math.ceil($visibleHeight / rowHeight), filteredRows.length - 1);
        } else {
            endIndex = getIndicesOnly(filteredRows, __scrollTop + $visibleHeight, row => row.y)[0];
        }
    }

    let paddingTop = 0;
    $: {
        paddingTop = filteredRows[startIndex] ? filteredRows[startIndex].y : 0;
    }

    let visibleRows = [];
    $: visibleRows = filteredRows.slice(startIndex, endIndex + 1);

    let visibleTasks: SvelteTask[]; // try to keep the same order in the array as before
    let previousOrder: { [id: PropertyKey]: number; } = {};
    $: {
        const tasks: SvelteTask[] = [];
        const rendered: { [id: PropertyKey]: boolean } = {};

        const tasksOrdered: SvelteTask[] = [];
        const order: { [id: PropertyKey]: number; } = {};
        // because svelte detaches html elements when their order changes (even when keyed)
        // this helps CSS transitions
        let ordered = true;
        let ordinal = 0;
        function tryRestorePosition(task: SvelteTask) {
            tasks.push(task);
            const id = task.model.id;
            if (previousOrder[id] != null) {
                tasksOrdered[previousOrder[id]] = task;
            } else {
                ordered = false;
            }

            order[id] = ordinal++;
        }

        for (let i = 0; i < visibleRows.length; i++) {
            const row = visibleRows[i];
            if ($rowTaskCache[row.model.id]) {
                for (let j = 0; j < $rowTaskCache[row.model.id].length; j++) {
                    const id = $rowTaskCache[row.model.id][j];
                    rendered[id] = true;
                    tryRestorePosition($taskStore.entities[id]);
                }
            }

            if (_reflectedTasksCache[row.model.id]) {
                for (const task of _reflectedTasksCache[row.model.id]) {
                    tryRestorePosition(task);
                }
            }
        }
        
        // render all tasks being dragged if not already
        for (const id in draggingTasks) {
            if (!rendered[id]) {
                rendered[id] = true;
                tryRestorePosition($taskStore.entities[id]);
            }
        }

        if (tasksOrdered.length !== tasks.length) {
            ordered = false;
        }

        previousOrder = ordered ? previousOrder : order;
        visibleTasks = ordered ? tasksOrdered : tasks;
    }

    let layoutChanged = {};
    let refreshLayout = {};
    /** apply layouts */
    $: {
        refreshLayout;

        const params: layouts.LayoutParams = {
            taskStore: $taskStore,
            rowStore: $rowStore,
            rowTasks: $rowTaskCache,
            rowHeight,
            rowPadding,
            rowReflectedTasks: _reflectedTasksCache,
            invalidatedRows,
            invalidatedTasks,
            invalidateFull,
        };

        if (layout === 'overlap') {
            layouts.overlap(params);
        }

        if (layout === 'pack') {
            layouts.pack(params);
        }

        if (layout === 'expand') {
            layouts.expand(params);
        }

        layoutChanged = {};
        invalidateFull = false;
        invalidatedTasks = {};
        invalidatedRows = {};
    }

    $: {
        layout;
        tasks;
        rows;
        updateLayout();
    }

    export function updateLayoutSync(_invalidateFull?: boolean) {
        const params: layouts.LayoutParams = {
            taskStore: $taskStore,
            rowStore: $rowStore,
            rowTasks: $rowTaskCache,
            rowHeight,
            rowPadding,
            rowReflectedTasks: _reflectedTasksCache,
            invalidatedRows,
            invalidatedTasks,
            invalidateFull: _invalidateFull ?? invalidateFull,
        };

        if (layout === 'overlap') {
            layouts.overlap(params);
        }

        if (layout === 'pack') {
            layouts.pack(params);
        }

        if (layout === 'expand') {
            layouts.expand(params);
        }

        layoutChanged = {};
        invalidateFull = false;
        invalidatedTasks = {};
        invalidatedRows = {};
    }

    export function updateLayout() {
        refreshLayout = {};
        invalidateFull = true;
    }

    /** enable create task by dragging */
    export let enableCreateTask = false;
    export let onCreateTask = (e: { from: number; to: number; resourceId: PropertyKey; }) => {
        const id: any = `creating-task-${(Math.random() + 1).toString(36).substring(2, 7)}`;
        return ({
            id,
            label: ' ',
            ...e,
        }) as TaskModel;
    }
    export let onCreatedTask = (task: SvelteTask) => {};

    let draggingTasks: { [taskId: PropertyKey]: DraggingState; } = {};
    let _creatingTask: SvelteTask = null;
    function onCreateTaskMove({ from, to, x, width, y }: MoveEvent) {
        if (!_creatingTask) {
            // TODO:: incorrect for collapsible rows, if creating under one
            const row = $allRows.find(row => row.y < y && y < row.y + row.height);
            const resourceId = row.model.id;
            _creatingTask = createTask(onCreateTask({
                resourceId,
                from,
                to,
            }));
            taskStore.upsert(_creatingTask);
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
        taskStore.upsert(_creatingTask);
        delete draggingTasks[_creatingTask.model.id];
        onCreatedTask(_creatingTask);
        _creatingTask = null;
    }

    const dragCreateTasks = useCreateTask();

    function onChange(e: CustomEvent<{ changes: DragChange[] }>) {
        if (e.detail.changes.some(c => !c.targetRow)) {
            return;
        }
        for (const change of e.detail.changes) {
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
                taskStore.update(newTask);
                invalidatePosition({ row: sourceRow });
                invalidatePosition({ task: newTask });
            }
        }
    }

    function onItemsChange(e: CustomEvent<{ items: { [taskId: PropertyKey]: DraggingState } }>) {
        draggingTasks = { ...e.detail.items };
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="sg-gantt {classes}"
    class:sg-disable-transition={disableTransition}
    bind:this={ganttElement}
    on:pointerdown|stopPropagation={onEvent}
    on:click|stopPropagation={onEvent}
    on:dblclick={onEvent}
    on:pointerover={onEvent}
    on:pointerleave={onEvent}
>
    {#each ganttTableModules as module}
        <svelte:component
            this={module}
            {rowContainerHeight}
            {paddingTop}
            {tableWidth}
            {...$$restProps}
            {visibleRows}
        />

        <Resizer x={tableWidth} on:resize={onResize} container={ganttElement}></Resizer>
    {/each}

    <div class="sg-timeline sg-view">
        <div class="sg-header" bind:this={mainHeaderContainer} bind:clientHeight={$headerHeight} style={`padding-right: ${$rightScrollbarVisible}px;`}>
            <div class="sg-header-scroller" use:horizontalScrollListener>
                <div class="header-container" style="width:{$_width}px">
                    <ColumnHeader
                        {headers}
                        ganttBodyColumns={columns}
                        ganttBodyUnit={columnUnit}
                        on:dateSelected={onDateSelected}
                    />
                    {#each $allTimeRanges as timeRange (timeRange.model.id)}
                        <TimeRangeHeader {...timeRange} />
                    {/each}
                </div>
            </div>
        </div>

        <div
            class="sg-timeline-body"
            bind:this={mainContainer}
            use:scrollable
            class:zooming
            on:wheel={onwheel}
            bind:clientHeight={$visibleHeight}
            bind:offsetHeight={offsetHeight}
            bind:clientWidth={$visibleWidth}
            bind:offsetWidth={offsetWidth}
            use:dragCreateTasks={{ container: rowContainer, enabled: enableCreateTask, onMove: onCreateTaskMove, onEnd: onCreateTaskEnd }}
        >
            <div class="content" style="width:{$_width}px">
                <Columns {columns} {columnStrokeColor} {columnStrokeWidth} {useCanvasColumns} />

                <div
                    class="sg-rows"
                    bind:this={rowContainer}
                    style="height:{rowContainerHeight}px;"
                >
                    <div style="transform: translateY({paddingTop}px);">
                        {#each visibleRows as row (row.model.id)}
                            <Row {row} />
                        {/each}
                    </div>
                </div>

                <div class="sg-foreground">
                    {#each $allTimeRanges as timeRange (timeRange.model.id)}
                        <TimeRange {...timeRange} />
                    {/each}

                    <DraggableGroup items={draggingTasks} on:change={onChange} on:itemsChange={onItemsChange}>
                        {#each visibleTasks as task (task.model.id)}
                            <Draggable {task} let:state let:onPointerDown>
                                <Task
                                    {...task}
                                    model={task.model}
                                    left={state.x}
                                    top={state.y}
                                    width={state.width}
                                    height={task.height}
                                    dragging={state.dragging}
                                    resizing={state.resizing}
                                    on:pointerdown={onPointerDown}
                                />
                            </Draggable>
                        {/each}
                    </DraggableGroup>
                </div>
                {#each ganttBodyModules as module}
                    <svelte:component
                        this={module}
                        {paddingTop}
                        {visibleRows}
                        {...$$restProps}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
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
        flex: 1 1 0%;
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
        flex: 1 1 auto;
    }

    .sg-header-scroller {
        /* border-right: 1px solid #efefef; // replace with element, or conditionally draw this border */
        overflow: hidden;
        position: relative;
    }

    .content {
        position: relative;
    }

    :global(*) {
        box-sizing: border-box;
    }
</style>
