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

export interface SvelteRow {
    model: RowModel;
    
    posY: number;
    height: number;
}

export class RowFactory {
    gantt: SvelteGantt;

    constructor(gantt: SvelteGantt){
        this.gantt = gantt;
    }

    createRow(row: RowModel, posY: number): SvelteRow {
        // defaults
        // id of task, every task needs to have a unique one
        //row.id = row.id || undefined;
        // css classes
        row.classes = row.classes || '';
        // html content of row
        row.contentHtml = row.contentHtml || undefined;
        // enable dragging of tasks to and from this row 
        row.enableDragging = row.enableDragging === undefined ? true : row.enableDragging;
        // height of row element
        const height = row.height || this.gantt.store.get().rowHeight;

        return {
            model: row,
            posY,
            height
        }
    }

    createRows(rows: RowModel[]) {
        let y = 0;

        const result = rows.map((currentRow, i) => {
            const row = this.createRow(currentRow, y);
            y += row.height;
            return row;
        });

        return result;
    }
}
