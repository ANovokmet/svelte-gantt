import { GanttStore } from './store';

export interface RowModel {
    id: number;
    classes?: string | string[];
    contentHtml?: string;
    enableDragging?: boolean;
    height: number;
}

export interface SvelteRow {
    model: RowModel;
    
    y: number;
    height: number;
}

export class RowFactory {
    store: GanttStore;

    constructor(store: GanttStore){
        this.store = store;
    }

    createRow(row: RowModel, y: number): SvelteRow {
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
        const height = row.height || this.store.get().rowHeight;

        return {
            model: row,
            y,
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
