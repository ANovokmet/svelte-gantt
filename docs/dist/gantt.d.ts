import { ColumnService } from './core/column';
import { GanttApi } from './core/api';
import { Component } from "./core/svelte";
import { DragDropManager } from './core/drag';
import { RowModel, RowFactory, SvelteRow } from './core/row';
import { TaskModel, TaskFactory, SvelteTask } from './core/task';
import { TimeRangeModel, TimeRangeFactory } from './core/timeRange';
import { GanttUtils } from './utils/utils';
import { DependencyModel } from './modules/dependencies';
import { Moment } from 'moment';
interface Header {
    unit: string;
    format: string;
    offset?: number;
    sticky?: boolean;
}
interface Zoom {
    headers: Header[];
    minWidth: number;
    fitWidth: boolean;
}
declare type TaskButtonClickHandler = (task: SvelteTask) => void;
declare type TaskContentTemplate = (task: SvelteTask) => string;
interface TableHeader {
    title: string;
    property: string;
    width?: number;
}
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
    /** datetime timeline starts on, moment */
    from?: Moment;
    /** datetime timeline ends on, moment */
    to?: Moment;
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
    ganttTableModules?: any[];
    ganttBodyModules?: any[];
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
    onTaskButtonClick?: TaskButtonClickHandler;
    /** task content factory function */
    taskContent?: TaskContentTemplate;
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
    refreshTasks(): any;
    refreshTimeRanges(): any;
    getRowContainer(): HTMLElement;
    selectTask(id: number): any;
    unselectTasks(): any;
    scrollToTask(id: number, scrollBehavior?: string): any;
    scrollToRow(id: number, scrollBehavior?: string): any;
    updateTask(model: TaskModel): any;
    updateTasks(models: TaskModel[]): any;
    updateRow(model: RowModel): any;
    updateRowss(models: RowModel[]): any;
    getTask(id: any): SvelteTask;
    getTasks(resourceId: any): SvelteTask[];
    getRow(id: any): SvelteRow;
}
export {};
