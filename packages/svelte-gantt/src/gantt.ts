import type { ColumnService } from './core/column';
import type { GanttApi } from './core/api';
import type { Component } from './core/svelte';
import type { DragDropManager } from './core/drag';
import type { RowModel, RowFactory, SvelteRow } from './core/row';
import type { TaskModel, TaskFactory, SvelteTask } from './core/task';
import type { TimeRangeModel, TimeRangeFactory } from './core/timeRange';
import type { GanttUtils } from './utils/utils';
import type { DependencyModel } from './modules/dependencies';
import type { TableHeader } from './modules/table/tableHeader';
import type { SvelteGanttDateAdapter } from './utils/date';
import type { Writable, Readable } from 'svelte/store';
import { SelectionManager } from './core/selectionManager';

interface Header {
    unit: string;
    format: string;
    offset?: number;
    sticky?: boolean;
}

export interface GanttContextDimensions {
    from: Writable<Date>;
    to: Writable<Date>;
    width: Writable<number>;
    dateAdapter: SvelteGanttDateAdapter;
    visibleWidth: Writable<number>;
    visibleHeight: Writable<number>;
    headerHeight: Writable<number>;
    bottomScrollbarVisible: Writable<number>;
    rightScrollbarVisible: Writable<number>;
}

export interface GanttContext {
    scrollables: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    hoveredRow: Writable<PropertyKey>;
    selectedRow: Writable<PropertyKey>;
    rowContainer: HTMLElement;
    mainContainer: HTMLElement;
    mainHeaderContainer: HTMLElement;
    updateLayout();
}

export interface GanttContextServices {
    utils: GanttUtils;
    api: GanttApi;
    dndManager: DragDropManager;
    selectionManager: SelectionManager;
    columnService: ColumnService;
}

export interface GanttContextOptions {
    dateAdapter: SvelteGanttDateAdapter;
    taskElementHook?: TaskElementHook;
    taskContent?: TaskContentTemplate;
    rowPadding: Writable<number>;
    rowHeight: Writable<number>;
    layout: Readable<'overlap' | 'pack'>;
    resizeHandleWidth: number;
    reflectOnParentRows: boolean;
    reflectOnChildRows: boolean;
    onTaskButtonClick?: TaskButtonClickHandler;
}

interface Zoom {
    headers: Header[];
    minWidth: number;
    fitWidth: boolean;
}

interface highlightedDurations {
    unit: string;
    fractions: number[];
}

type TaskButtonClickHandler = (task: TaskModel, event?: MouseEvent) => void;
type TaskContentTemplate = (task: TaskModel) => string;
type TaskElementHook = (task: SvelteTask, element: HTMLElement) => void;

export interface SvelteGanttOptions {
    /**
     * Rows to load in the gantt
     */
    rows?: RowModel[];
    /**
     * Tasks that display in the gantt
     */
    tasks?: TaskModel[];
    /**
     * Timeranges that display in the gantt
     */
    timeRanges?: TimeRangeModel[];
    /**
     * Dependencies that display in the gantt, used with the SvelteGanttDependencies module
     */
    dependencies?: DependencyModel[];
    /** datetime timeline starts on, date */
    from?: number;
    /** datetime timeline ends on, date */
    to?: number;
    /** Minimum width of main gantt area in px */
    minWidth?: number;
    /** should timeline stretch width to fit */
    fitWidth?: boolean;
    /** minimum unit of time task date values will round to */
    magnetUnit?: string;
    /** amount of units task date values will round to */
    magnetOffset?: number;
    /** duration unit of columns */
    columnUnit?: string;
    /** duration width of column */
    columnOffset?: number;
    /** width of strokes seperating the columns in ganttbody */
    columnStrokeWidth?: number;
    /** color of strokes seperating the columns in ganttbody */
    columnStrokeColor?: string;
    /** object including a unit and fractions of that unit that should be highlighted eg. {unit: 'days', fractions: [0,6]} -> will highlight weekends.
     *  highlighting will only work correctly if highlighted unit is the same or a constant fraction of the column unit eg. days, hours, minutes in the above.
     */
    highlightedDurations?: highlightedDurations;
    /**
     * list of headers used for main gantt area
     *  - unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
     *  - format: datetime format used for header cell label
     **/
    headers?: Header[];
    /**
     * List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
     */
    zoomLevels?: Zoom[];
    /** height of a single row in px */
    rowHeight?: number;
    rowPadding?: number;
    /** modules used in gantt */
    ganttTableModules?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    ganttBodyModules?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree.
     */
    reflectOnParentRows?: boolean;
    /**
     * When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree.
     */
    reflectOnChildRows?: boolean;
    /** sets top level gantt class which can be used for styling */
    classes?: string | string[];
    /** width of handle for resizing task */
    resizeHandleWidth?: number;
    /** handler of button clicks */
    onTaskButtonClick?: TaskButtonClickHandler; // e.g. (task) => {debugger},
    /** task content factory function */
    taskContent?: TaskContentTemplate; // e.g. (task) => '<div>Custom task content</div>'
    /** task element hook */
    taskElementHook?: (node: HTMLElement, task: SvelteTask) => { update?(task); destroy?() };
    /**
     * Width of table, used with SvelteGanttTable module
     */
    tableWidth?: number;
    /**
     * Headers of table, used with SvelteGanttTable module
     */
    tableHeaders?: TableHeader[];
}

export interface SvelteGanttComponent extends Component<SvelteGanttOptions> {
    api: GanttApi;
    utils: GanttUtils;
    columnService: ColumnService;
    dndManager: DragDropManager;
    taskFactory: TaskFactory;
    rowFactory: RowFactory;
    timeRangeFactory: TimeRangeFactory;

    refreshTasks();
    refreshTimeRanges();
    getRowContainer(): HTMLElement;
    selectTask(id: number);
    unselectTasks();
    scrollToTask(id: number, scrollBehavior?: string);
    scrollToRow(id: number, scrollBehavior?: string);

    updateTask(model: TaskModel);
    updateTasks(models: TaskModel[]);
    updateRow(model: RowModel);
    updateRows(models: RowModel[]);
    getTask(id): SvelteTask;
    getTasks(resourceId): SvelteTask[];
    getRow(id): SvelteRow;
}
