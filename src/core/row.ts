export interface RowModel {
    id: number;
    classes?: string | string[];
    contentHtml?: string;
    enableDragging?: boolean;
    height: number;
    /** Child rows in expandable tree */
    children?: RowModel[];
    /** Content of row header, html string */
    headerHtml?: string;
    /** Class of icon in row header */
    iconClass?: string;
    /** Url of image in row header */
    imageSrc?: string;
    expanded?:boolean
}

export interface SvelteRow {
    model: RowModel;
    
    y: number;
    height: number;
    hidden?: boolean;
    children?: SvelteRow[];
    allChildren?: SvelteRow[];
    parent?: SvelteRow;
    allParents?: SvelteRow[];
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
        this.createChildRows(rows, ctx);
        return ctx.result;
    }

    createChildRows(rowModels: RowModel[], ctx: { y: number, result: SvelteRow[] }, parent: SvelteRow = null, level: number = 0, parents: SvelteRow[] = []) {
        const rowsAtLevel = [];
        const allRows = [];

        if(parent) {
            parents = [...parents, parent];
        }

        rowModels.forEach(rowModel => {
            const row = this.createRow(rowModel, ctx.y);
            ctx.result.push(row);
            rowsAtLevel.push(row);
            allRows.push(row);

            row.childLevel = level;
            row.parent = parent;
            row.allParents = parents;
            
            ctx.y += row.height;

            if(rowModel.children) {
                const nextLevel = this.createChildRows(rowModel.children, ctx, row, level+1, parents);
                row.children = nextLevel.rows;
                row.allChildren = nextLevel.allRows;
                allRows.push(...nextLevel.allRows);
            }
        });
        return {
            rows: rowsAtLevel,
            allRows
        };
    }
}
