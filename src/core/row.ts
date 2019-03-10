import { SvelteGantt } from "./gantt";
import { SvelteTask, TaskModel } from "./task";
import { Component } from "./svelte";

export interface RowModel {
    id: number;
    classes?: string | string[];
    contentHtml?: string;
    enableDragging?: boolean;
    height: number;
}

export class SvelteRow {

    gantt: SvelteGantt;
    model: RowModel;
    component: Component;
    
    order: number;
    posY: number;
    height: number;
    tasks: SvelteTask[];

    constructor(gantt: SvelteGantt, row: RowModel){
        // defaults
        // id of task, every task needs to have a unique one
        //row.id = row.id || undefined;
        // css classes
        row.classes = row.classes || '';
        // html content of row
        row.contentHtml = row.contentHtml || undefined;
        // enable dragging of tasks to and from this row 
        row.enableDragging = row.enableDragging === undefined ? true : row.enableDragging;
        //
        this.height = row.height || gantt.store.get().rowHeight;
        // translateY

        this.gantt = gantt;
        this.model = row;
        this.tasks = [];
    }

    addTask(task: SvelteTask) {
        //task.model.resourceId = this.model.id;
        task.row = this;
        this.tasks.push(task);
    }

    moveTask(task: SvelteTask) {
        //task.row.removeTask(task);
        this.addTask(task);
    }

    removeTask(task: SvelteTask) {
        //task.model.resourceId
        //task.row = this;
        const index = this.tasks.indexOf(task);
        if(index !== -1){
            this.tasks.splice(index, 1);
        }
    }

    updateView() {
        if(this.component) {
            this.component.set({row: this});
        }
    }

    // updateVisibleTasks() {
    //     const { from, to } = this.gantt.store.get();
    //     this.visibleTasks = this.tasks.filter(task => !(task.model.to < from || task.model.from > to));
    // }
}
