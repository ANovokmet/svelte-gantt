export interface RowModel {
    /**
     * Id of row, every resource needs to have a unique one
     */
    id: PropertyKey;
    label: string;
    classes?: string | string[];
    contentHtml?: string;
    height?: number;

    /** 
     * enable dragging to row
     * @deprecated use draggable
     **/
    enableDragging?: boolean;
    /** 
     * enable dragging to row
     **/
    draggable?: boolean;
    /** 
     * enable resizing on row
     * @deprecated use resizable
     */
    enableResize?: boolean;
    /** 
     * enable resizing on row
     */
    resizable?: boolean;

    /** Child rows in expandable tree */
    children?: RowModel[];
    expanded?: boolean;
    /** Content of row header, html string */
    headerHtml?: string;
    /**
     * Class of icon in row header
     * @deprecated
     **/
    iconClass?: string;
    /**
     * Url of image in row header
     * @deprecated
     **/
    imageSrc?: string;
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
    childLevel?: number;
}

export type CreateRowParams = {
    rowHeight: number;
}

export function createRows(rows: RowModel[], params: CreateRowParams) {
    const context = { y: 0, result: [] };
    createChildRows(rows, context, params);
    return context.result;
}

function createChildRows(
    rowModels: RowModel[],
    context: { y: number; result: SvelteRow[] },
    params: CreateRowParams,
    parent: SvelteRow = null,
    level: number = 0,
    parents: SvelteRow[] = [],
) {
    const rowsAtLevel = [];
    const allRows = [];

    if (parent) {
        parents = [...parents, parent];
    }

    for (const model of rowModels) {
        const row = createRow(model, context.y, params);
        context.result.push(row);
        rowsAtLevel.push(row);
        allRows.push(row);

        row.childLevel = level;
        row.parent = parent;
        row.allParents = parents;
        if (parent) {
            // when row is hidden, other rows (y-pos) move upward
            row.hidden = !(parent.model.expanded || parent.model.expanded == null) || parent.hidden != null && parent.hidden;
        }

        if (!row.hidden) {
            context.y += row.height;
        }

        if (model.children) {
            const nextLevel = createChildRows(
                model.children,
                context,
                params,
                row,
                level + 1,
                parents,
            );
            row.children = nextLevel.rows;
            row.allChildren = nextLevel.allRows;
            allRows.push(...nextLevel.allRows);
        }
    }

    return {
        rows: rowsAtLevel,
        allRows
    };
}

function createRow(model: RowModel, y: number, params: CreateRowParams): SvelteRow {
    // defaults
    // height of row element
    const height = model.height ?? params.rowHeight;

    return {
        model: model,
        y,
        height,
    };
}

export function expandRow(row: SvelteRow) {
    row.model.expanded = true;
    if (row.children) show(row.children);
}

export function collapseRow(row: SvelteRow) {
    row.model.expanded = false;
    if (row.children) hide(row.children);
}

function hide(children: SvelteRow[]) {
    for (const row of children) {
        if (row.children) hide(row.children);
        row.hidden = true;
    }
}

function show(children: SvelteRow[], hidden = false) {
    for (const row of children) {
        if (row.children) show(row.children, !row.model.expanded);
        row.hidden = hidden;
    }
}