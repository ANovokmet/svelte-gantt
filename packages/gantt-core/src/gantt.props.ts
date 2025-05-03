import type { HighlightedDurations } from './core/column';
import type { RowModel } from './core/row';
import type { SelectionState } from './core/selection';
import type { SvelteTask, TaskModel } from './core/task';
import type { TimeRangeModel } from './core/timeRange';
import type { Header } from './gantt';
import type { SvelteHeaderCell } from './gantt.builder';
import type { DependencyModel } from './modules/dependencies';
import type { TableHeader } from './modules/table/tableHeader';
import type { SvelteGanttDateAdapter } from './utils/date';
import { DefaultSvelteGanttDateAdapter } from './utils/defaultDateAdapter';
import type { MaybeGetter } from './utils/getters';

export type GanttProps = BaseProps & TableProps & DependenciesProps;

export type BaseProps = {
  /**
   * Rows to load in the gantt
   */
  rows: MaybeGetter<RowModel[]>;
  /**
   * Tasks that display in the gantt
   */
  tasks?: MaybeGetter<TaskModel[]>;
  /**
   * Timeranges that display in the gantt
   */
  timeRanges?: MaybeGetter<TimeRangeModel[]>;

  /** top and bottom padding of a single row in px */
  rowPadding?: number;
  /** height of a single row in px */
  rowHeight?: number;
  /** datetime timeline starts on, date */
  from: any;
  /** datetime timeline ends on, date */
  to: any;
  /** Minimum width of main gantt area in px */
  minWidth?: number;
  /** should timeline stretch width to fit */
  fitWidth?: boolean;
  /** sets top level gantt class which can be used for styling */
  classes?: string | string[];
  /**
   * list of headers used for main gantt area
   *  - unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
   *  - format: datetime format used for header cell label
   **/
  headers?: Header[];
  /**
   * List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
   */
  zoomLevels?: any;
  /** task content factory function, e.g. (task) => '<div>Custom task content</div>'  */
  taskContent?: any;
  /**
   * Width of table, used with SvelteGanttTable module
   */
  tableWidth?: number;
  /** width of handle for resizing task */
  resizeHandleWidth?: number;
  dateAdapter?: SvelteGanttDateAdapter;
  /** minimum unit of time task date values will round to */
  magnetUnit?: string;
  /** amount of units task date values will round to */
  magnetOffset?: number;
  /** duration unit of columns */
  columnUnit?: string;
  /** duration width of column */
  columnOffset?: number;
  // export until Svelte3 implements Svelte2's setup(component) hook
  ganttTableModules?: any;
  ganttBodyModules?: any;
  /**
   * When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree.
   */
  reflectOnParentRows?: boolean;
  /**
   * When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree.
   */
  reflectOnChildRows?: boolean;
  /**
   * Render columns in a canvas, results in a better performance.
   * Set to false if advanced CSS styling is needed.
   **/
  useCanvasColumns?: boolean;
  /** color of strokes seperating the columns in ganttbody */
  columnStrokeColor?: string;
  /** width of strokes seperating the columns in ganttbody */
  columnStrokeWidth?: number;
  /**
   * object including a unit and fractions of that unit that should be highlighted eg. {unit: 'days', fractions: [0,6]} -> will highlight weekends.
   * highlighting will only work correctly if highlighted unit is the same or a constant fraction of the column unit eg. days, hours, minutes in the above.
   */
  highlightedDurations?: HighlightedDurations;
  highlightColor?: string;
  /** Allows working with the actual DOM node */
  taskElementHook?: any;
  /** Controls how the tasks will render */
  layout?: 'overlap' | 'pack' | 'expand';
  /** enable create task by dragging */
  enableCreateTask?: boolean;
  onCreateTask?: any;
  onCreatedTask?: any;

  onRowsChange(e: RowModel[], changed: RowModel | RowModel[]): void;
  onTasksChange(e: TaskModel[], changed: TaskModel | TaskModel[]): void;
  onTimeRangesChange(e: TimeRangeModel[], changed: TimeRangeModel | TimeRangeModel[]): void;

  ganttState: MaybeGetter<GanttState>;
  onGanttStateChange(e: GanttState): void;
  viewport: MaybeGetter<ViewportState>;
  onViewportChange(e: ViewportState): void;

  // [key: string]: any
  // computed: <T>(fn: () => T) => (() => T);

  onHeaderSelect?: (e: SvelteHeaderCell) => void;
}

export type TableProps = {
  tableHeaders?: MaybeGetter<TableHeader[]>;
};

export type DependenciesProps = {
  dependencies?: MaybeGetter<DependencyModel[]>;
}

export const defaults: Partial<GanttProps> = {
  // rows,
  tasks: [],
  timeRanges: [],
  rowPadding: 6,
  rowHeight: 52,
  // from,
  // to,
  minWidth: 800,
  fitWidth: false,
  classes: [],
  headers: [
    { unit: 'day', format: 'MMMM Do' },
    { unit: 'hour', format: 'H:mm' }
  ],
  zoomLevels: [
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
  taskContent: null,
  tableWidth: 240, // $bindable
  resizeHandleWidth: 10,
  dateAdapter: new DefaultSvelteGanttDateAdapter(),
  magnetUnit: 'minute',
  magnetOffset: 15,
  columnUnit: 'minute', // $bindable
  columnOffset: 15, // $bindable
  ganttTableModules: [],
  ganttBodyModules: [],
  reflectOnParentRows: true,
  reflectOnChildRows: false,
  useCanvasColumns: true,
  columnStrokeColor: '#efefef',
  columnStrokeWidth: 1,
  highlightedDurations: undefined,
  highlightColor: '#6eb859',
  taskElementHook: null,
  layout: 'overlap',
  enableCreateTask: false,
  onCreateTask: (e: { from: number; to: number; resourceId: PropertyKey; }) => {
    const id: any = `creating-task-${(Math.random() + 1).toString(36).substring(2, 7)}`;
    return ({
      id,
      label: ' ',
      ...e,
    }) as TaskModel;
  },
  onCreatedTask: (_task: SvelteTask) => { },
};

export type ViewportState = {
  visibleHeight: number;
  visibleWidth: number;
  offsetHeight: number;
  offsetWidth: number;
};

export type GanttState = {
  expanded: Record<PropertyKey, boolean>;
  hoveredRow: PropertyKey | null;
  selectedRow: PropertyKey | null;
  selection: SelectionState;
};

export type SvelteHeader = {
  header: Header;
  cells: SvelteHeaderCell[];
}

export type SvelteHeaderCell = {
  label: string;
  from: number;
  to: number;
  left: number;
  width: number;
  events?: Events;
}

export type Events = Record<string, (e: Event) => void>;