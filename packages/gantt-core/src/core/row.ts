import { GanttBuilder } from '../gantt.builder';

export interface RowModel {
  /**
   * Id of row, every resource needs to have a unique one
   */
  id: PropertyKey;
  label?: string;
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
}

export interface SvelteRow<T extends RowModel = RowModel> {
  model: T;

  readonly id: string;

  y: number;
  height: number;
  // hidden?: boolean;
  // children?: SvelteRow[];
  allChildren?: SvelteRow[];
  parent?: SvelteRow;
  allParents?: SvelteRow[];

  // expandable
  children?: SvelteRow[];
  depth: number;
  readonly expanded: boolean;
  readonly toggleExpanded: (e: Event) => void;
  readonly hovered: boolean;
  readonly selected: boolean;
}

export type CreateRowParams = {
  rowHeight: number;
}

export class RowFactory {
  constructor(private gantt: GanttBuilder) {
  }

  createRows(rowModels: RowModel[]) {
    const context = { y: 0, result: [] };

    const rowContext: RowContext = {
      rows: [],
      flatRows: [],
      rowsById: {},
    };

    const accessRows = (rowModels: RowModel[], depth = 0, parent?: SvelteRow) => {
      const rows: SvelteRow[] = [];

      for (const rowModel of rowModels) {
        const row = this.createRow(rowModel, context.y, depth, parent);
        // context.y += row.height;

        rows.push(row);
        rowContext.flatRows.push(row);
        rowContext.rowsById[row.id] = row;

        const originalChildren = rowModel.children;
        if (originalChildren && originalChildren.length) {
          row.children = accessRows(originalChildren, depth + 1, row);
        }
      }

      return rows;
    }

    rowContext.rows = accessRows(rowModels);


    return expandRows(rowContext);
  }

  createRow(model: RowModel, y: number, depth: number, parent?: SvelteRow): SvelteRow {
    const base = model.height ?? this.gantt.options.rowHeight;
    const gantt = this.gantt;
    const id = String(model.id);

    const row: SvelteRow = {
      id,
      model: model,
      get y() {
        // return 100;
        return gantt.getLayout().rowPositions[id]?.y;
      },
      get height() {
        // return base;
        return gantt.getLayout().rowPositions[id]?.height ?? base;
      },
      get expanded(): boolean {
        return gantt.state.expanded[id] ?? false;
      },
      toggleExpanded: () => {
        model.expanded = !model.expanded;
        gantt.onStateChange({ expanded: { ...gantt.state.expanded, [id]: !row.expanded } });
      },
      depth,
      parent,
      get hovered() {
        return gantt.state.hoveredRow == id;
      },
      get selected() {
        return gantt.state.selectedRow == id;
      },
    };

    return row;
  }
}

export interface RowContext {
  rows: SvelteRow[]
  flatRows: SvelteRow[]
  rowsById: Record<PropertyKey, SvelteRow>
}

function expandRows(rowModel: RowContext) {
  const expandedRows: SvelteRow[] = [];

  const handleRow = (row: SvelteRow) => {
    expandedRows.push(row);

    if (row.children?.length && row.expanded) {
      for (const childRow of row.children) {
        handleRow(childRow);
      }
    }
  }

  rowModel.rows.forEach(handleRow)

  return {
    rows: expandedRows,
    flatRows: rowModel.flatRows,
    rowsById: rowModel.rowsById,
  }
}