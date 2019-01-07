import { SvelteTask } from "../../core/task";
import { SvelteGantt } from "../../core/gantt";
import { Component } from "../../core/svelte";

export interface DependencyModel {
    id: number;

}

export default class SvelteDependency {

    gantt: SvelteGantt;
    model: DependencyModel;
    fromTask: SvelteTask;
    toTask: SvelteTask;
    component: Component;

    constructor(gantt, model){
        this.model = model;
        this.gantt = gantt;

        const {_taskCache} = gantt.get();
        this.fromTask = _taskCache[model.fromTask];
        this.toTask = _taskCache[model.toTask];

        this.update();
    }

    update() {
        const {rows, rowHeight} = this.gantt.store.get();

        let startX = this.fromTask.left + this.fromTask.width;
        let endX = this.toTask.left;

        //can be sped up by caching indices of rows
        let startIndex = rows.indexOf(this.fromTask.row); 
        let endIndex = rows.indexOf(this.toTask.row); 

        let startY = (startIndex + 0.5) * rowHeight;
        let endY = (endIndex + 0.5) * rowHeight;

        const result = {startX, startY, endX, endY}
        Object.assign(this, result);
        return result;
    }

    updateView() {
        if(this.component) {
            this.component.set({dependency: this});
        }
    }
}