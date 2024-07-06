export interface RowModel {
    id: PropertyKey;
    label: string;
    classes?: string | string[];
    contentHtml?: string;
    enableDragging?: boolean;
    enableResize?: boolean;
    height: number;
    /** Child rows in expandable tree */
    children?: RowModel[];
    /** Content of row header, html string */
    headerHtml?: string;
    /** Class of icon in row header */
    iconClass?: string;
    /** Url of image in row header */
    imageSrc?: string;
    expanded?: boolean;
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
    // id of task, every task needs to have a unique one
    //row.id = row.id || undefined;
    // css classes
    model.classes = model.classes ?? '';
    // enable dragging of tasks to and from this row
    model.enableDragging = model.enableDragging ?? true;
    model.enableResize = model.enableResize ?? true;
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