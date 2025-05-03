import type { GanttApi } from './core/api';
import type { ColumnService } from './core/column';
import type { RowModel, SvelteRow } from './core/row';
import type { SvelteTask, TaskModel } from './core/task';
import type { TimeRangeModel } from './core/timeRange';
import type { DependencyModel } from './modules/dependencies';
import type { TableHeader } from './modules/table/tableHeader';
import type { SvelteGanttDateAdapter } from './utils/date';
import type { GanttUtils } from './utils/utils';

export interface Header {
  unit: string;
  format: string;
  offset?: number;
  sticky?: boolean;
}

export interface GanttContext {
  utils: GanttUtils;
  api: GanttApi;
  columnService: ColumnService;
}

export type InvalidatePositionOptions = {
  task?: SvelteTask;
  row?: SvelteRow;
};

export interface GanttContextOptions {
  dateAdapter: SvelteGanttDateAdapter;
  taskElementHook?: TaskElementHook;
  taskContent?: TaskContentTemplate;
  readonly rowPadding: number;
  readonly rowHeight: number;
  layout: 'overlap' | 'pack';
  resizeHandleWidth: number;
  reflectOnParentRows: boolean;
  reflectOnChildRows: boolean;
  from: Date;
  to: Date;
  width: number;
  visibleWidth: number;
  visibleHeight: number;
  bottomScrollbarVisible: number;
  rightScrollbarVisible: number;
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
  /** task content factory function */
  taskContent?: TaskContentTemplate; // e.g. (task) => '<div>Custom task content</div>'
  /** task element hook */
  taskElementHook?: (node: HTMLElement, task: SvelteTask) => { update?(task: SvelteTask): void; destroy?(): void };
  /**
   * Width of table, used with SvelteGanttTable module
   */
  tableWidth?: number;
  /**
   * Headers of table, used with SvelteGanttTable module
   */
  tableHeaders?: TableHeader[];
}
