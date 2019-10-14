import { Component } from "./svelte";
import { ColumnFactory } from "./column";
import { GanttStore } from "./store";
import { GanttUtils } from "src/utils/utils";
import { GanttApi } from "./api";
import { DragDropManager } from "./drag";

export interface SvelteGantt extends Component {
    api: GanttApi;
    utils: GanttUtils;
    columnFactory: ColumnFactory;
    store: GanttStore;
    dndManager: DragDropManager;
}