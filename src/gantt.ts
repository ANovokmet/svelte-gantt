import { GanttStore } from "./core/store";
import { ColumnService } from './core/column';
import { GanttUtils } from './utils/utils';
import { GanttApi } from './core/api';
import { DragDropManager } from './core/drag';
import { RowModel, RowFactory } from './core/row';
import { TaskModel, TaskFactory, SvelteTask } from './core/task';
import { TimeRangeModel, TimeRangeFactory } from './core/timeRange';
import { Moment } from 'moment';
import { Component } from "./core/svelte";

type Header = { unit:string, format:string, offset?: number };
// can actually contain any option
type Zoom = {
	headers: Header[],
	minWidth: number,
	stretchTimelineWidthToFit: boolean
}
type TaskButtonClickHandler = (task: SvelteTask) => void;
type TaskContentTemplate = (task: SvelteTask) => string;

export interface SvelteGanttOptions {
	/** datetime timeline starts on, moment */
	from?: Moment;
	/** datetime timeline ends on, moment */
	to?: Moment;
	/** width of main gantt area in px, rename to timelineWidth */
	minWidth?: number;
	/** should timeline stretch width to fit, true overrides timelineWidth */
	stretchTimelineWidthToFit?: boolean,
	/** minimum unit of time task date values will round to */
	magnetUnit?: string,
	/** amount of units task date values will round to */
	magnetOffset?: number,
	/** duration unit of columns */
	columnUnit?: string,
	/** duration width of column */
	columnOffset?: number,
	/** 
	 * list of headers used for main gantt area
	 *  - unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
	 *  - format: datetime format used for header cell label 
	 **/
	headers?: Header[],
	zoomLevels?: Zoom[],
	/** current zoom level */
	zoom?: number,
	/** height of a single row in px */
	rowHeight?: number,
	rowPadding?: number,
	/** modules used in gantt */
	modules?: any[],
	/** enables right click context menu */
	enableContextMenu?: boolean,
	/** sets top level gantt class which can be used for styling */
	classes?: string | string[],
	/** width of handle for resizing task */
	resizeHandleWidth?: number,
	/** handler of button clicks */
	onTaskButtonClick?: TaskButtonClickHandler, // e.g. (task) => {debugger},
	/** task content factory function */
	taskContent?: TaskContentTemplate, // e.g. (task) => '<div>Custom task content</div>'

	rows?: RowModel[],
	tasks?: TaskModel[],
	_timeRanges?: TimeRangeModel[]
}

export interface SvelteGanttData {
	rows: RowModel[],
	tasks: TaskModel[],
}

export interface SvelteGanttComponent extends Component {
	api: GanttApi;
	utils: GanttUtils;
	columnService: ColumnService;
	store: GanttStore;
	dndManager: DragDropManager;
	taskFactory: TaskFactory;
	rowFactory: RowFactory;
	timeRangeFactory: TimeRangeFactory;

	refreshTasksDebounced();
	adjustVisibleDateRange({ from, to, unit });
	initRows(rowsData: RowModel[]);
	initTasks(taskData: TaskModel[]);
	initTimeRanges(timeRangeData: TimeRangeModel[]);
	updateVisibleEntities();
	refreshTasks();
	updateView(options: SvelteGanttOptions);
	selectTask(id: number);
}

export const defaults: SvelteGanttOptions = {
	// datetime timeline starts on, currently moment-js object
	from: null,
	// datetime timeline ends on, currently moment-js object
	to: null,
	// width of main gantt area in px
	minWidth: 800, //rename to timelinewidth
	// should timeline stretch width to fit, true overrides timelineWidth
	stretchTimelineWidthToFit: false,
	// minimum unit of time task date values will round to
	magnetUnit: 'minute',
	// amount of units task date values will round to
	magnetOffset: 15,
	// duration unit of columns
	columnUnit: 'minute',
	// duration width of column
	columnOffset: 15,
	// list of headers used for main gantt area
	// unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
	// format: datetime format used for header cell label
	headers: [
		{ unit: 'day', format: 'DD.MM.YYYY' },
		{ unit: 'hour', format: 'HH' }
	],
	zoomLevels: [
		{
			headers: [
				{ unit: 'day', format: 'DD.MM.YYYY' },
				{ unit: 'hour', format: 'HH' }
			],
			minWidth: 800,
			stretchTimelineWidthToFit: true
		},
		{
			headers: [
				{ unit: 'hour', format: 'ddd D/M, H A' },
				{ unit: 'minute', format: 'mm', offset: 15 }
			],
			minWidth: 5000,
			stretchTimelineWidthToFit: false
		}
	],
	zoom: 0,
	// height of a single row in px
	rowHeight: 52,
	rowPadding: 6,
	// modules used in gantt
	modules: [],
	// enables right click context menu
	enableContextMenu: false,
	// sets top level gantt class which can be used for styling
	classes: '',
	// width of handle for resizing task
	resizeHandleWidth: 10,
	// handler of button clicks
	onTaskButtonClick: null, // e.g. (task) => {debugger},
	// task content factory function
	taskContent: null, // e.g. (task) => '<div>Custom task content</div>'

	rows: [],
	tasks: [],
	_timeRanges: [],
};
