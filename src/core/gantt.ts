import { Component } from "./svelte";
import { ColumnService } from "./column";
import { GanttStore } from "./store";
import { GanttUtils } from "src/utils/utils";
import { GanttApi } from "./api";
import { DragDropManager } from "./drag";
import { RowModel, RowFactory } from "./row";
import { TaskModel, TaskFactory } from "./task";
import { TimeRangeModel, TimeRangeFactory } from "./timeRange";

export interface SvelteGantt extends Component {
    api: GanttApi;
    utils: GanttUtils;
    columnService: ColumnService;
    store: GanttStore;
    dndManager: DragDropManager;
    taskFactory: TaskFactory;
    rowFactory: RowFactory;
    timeRangeFactory: TimeRangeFactory;

    updateView(options: any);
    initRows(rowsData: RowModel[]);
    initTasks(taskData: TaskModel[]);
    initTimeRanges(data: TimeRangeModel[]);
    selectTask(id: number);
}

export interface SvelteGanttOptions {

}

export interface SvelteGanttData {
    rows: RowModel[],
    tasks: TaskModel[],
}

export interface SvelteGanttFactory extends SvelteGantt {
    defaults: SvelteGanttOptions;
    create(target: HTMLElement, data: SvelteGanttData, options: SvelteGanttOptions)
}

export declare var SvelteGantt: SvelteGanttFactory; 