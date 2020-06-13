export interface RowModel {
    id: number;
    classes?: string | string[];
    contentHtml?: string;
    enableDragging?: boolean;
    height: number;
    children?: RowModel[];
}

export interface SvelteRow {
    model: RowModel;
    
    y: number;
    height: number;
    hidden?: boolean;
    children?: SvelteRow[];
    parent?: SvelteRow;
    expanded?: boolean;
    childLevel?: number;
}

export class RowFactory {
    rowHeight: number;

    constructor(){
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
        const height = row.height || this.rowHeight;

        return {
            model: row,
            y,
            height,
            expanded: true
        }
    }

    createRows(rows: RowModel[]) {
        const ctx = { y: 0, result: [] };
        this._createRows(rows, ctx);
        return ctx.result;
    }

    _createRows(rowModels: RowModel[], ctx: { y: number, result: SvelteRow[] }, parent: SvelteRow = null, level: number = 0) {
        const rowsAtLevel = [];
        rowModels.forEach(rowModel => {
            const row = this.createRow(rowModel, ctx.y);
            ctx.result.push(row);
            rowsAtLevel.push(row);
            row.childLevel = level;
            row.parent = parent;
            ctx.y += row.height;

            if(rowModel.children) {
                row.children = this._createRows(rowModel.children, ctx, row, level+1);
            }
        });
        return rowsAtLevel;
    }
}
