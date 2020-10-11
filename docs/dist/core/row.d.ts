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
    allChildren?: SvelteRow[];
    parent?: SvelteRow;
    allParents?: SvelteRow[];
    expanded?: boolean;
    childLevel?: number;
}
export declare class RowFactory {
    rowHeight: number;
    constructor();
    createRow(row: RowModel, y: number): SvelteRow;
    createRows(rows: RowModel[]): any[];
    createChildRows(rowModels: RowModel[], ctx: {
        y: number;
        result: SvelteRow[];
    }, parent?: SvelteRow, level?: number, parents?: SvelteRow[]): {
        rows: any[];
        allRows: any[];
    };
}
