import type { SvelteRow } from './row';
import type { EntityState } from './store';
import type { SvelteTask } from './task';

export type LayoutParams = {
    taskStore: EntityState<SvelteTask>; 
    rowStore: EntityState<SvelteRow>;
    rowTasks: { [rowId: PropertyKey]: PropertyKey[] }; 
    rowHeight: number; 
    rowPadding: number; 
    rowReflectedTasks: { [rowId: PropertyKey]: SvelteTask[] }; 
    invalidatedTasks: { [rowId: PropertyKey]: boolean; }; 
    invalidatedRows: { [rowId: PropertyKey]: boolean; };
    invalidateFull?: boolean;
}

type LayoutRowParams = {
    rowHeight: number; 
    rowPadding: number; 
    expandRow?: boolean;
}

type LayoutResult = {
    changed: boolean;
}

/**
 * Layouts tasks - overlapping tasks display one over another
 * @param params 
 */
export function overlap(params: LayoutParams): LayoutResult {
    const { taskStore, rowStore, rowHeight, rowPadding, rowReflectedTasks } = params;
    let top = 0;
    const result: LayoutResult = { changed: false };

    if (!params.invalidateFull) {
        for (const taskId in params.invalidatedTasks) {
            positionTask(taskStore.entities[taskId]);
        }
        return result;
    }

    for (const rowId of rowStore.ids) {
        const row = rowStore.entities[rowId];
        row.y = top;
        const prevHeight = row.height;
        row.height = row.model.height || rowHeight;
        if (!row.hidden) {
            top += row.height;
        }

        if (prevHeight !== row.height) {
            result.changed = true;
        }

        const reflectedTasks = rowReflectedTasks[rowId];
        if (reflectedTasks) {
            for (const task of reflectedTasks) {
                positionTask(task);
            }
        }
    }

    function positionTask(task: SvelteTask) {
        const row = rowStore.entities[task.model.resourceId];
        if (!row) return;
        task.height = (row ? row.height : undefined) - 2 * rowPadding;
        task.top = row.y + rowPadding;
    }

    for (const taskId of taskStore.ids) {
        positionTask(taskStore.entities[taskId]);
    }

    return result;
}

/**
 * Layouts tasks - overlapping tasks display in the same row, but shrink to not overlap with eachother
 * @param params 
 */
export function pack(params: LayoutParams) {
    // TODO:: partial invalidation
    return _layoutRows(params, false);
}

/**
 * Layouts tasks - overlapping tasks display in the same row, but row is expanded to fit them
 * @param params 
 * @returns 
 */
export function expand(params: LayoutParams) {
    // TODO:: partial invalidation
    return _layoutRows(params, true);
}

function _layoutRows(params: LayoutParams, expandRow: boolean) {
    const { taskStore, rowStore, rowTasks, rowHeight, rowPadding } = params;
    let top = 0;
    const result: LayoutResult = { changed: false };
    for (const rowId of rowStore.ids) {
        const row = rowStore.entities[rowId];
        const taskIds = rowTasks[rowId];
        row.y = top;
        const prevHeight = row.height;
        if (taskIds) {
            const tasks = taskIds.map(taskId => taskStore.entities[taskId]);
            _layoutRow(tasks, row, { 
                rowHeight: rowHeight,
                rowPadding,
                expandRow,
            });
        }

        if (!row.hidden) {
            top += row.height;
        }
        if (prevHeight !== row.height) {
            result.changed = true;
        }
    }
}

function _layoutRow(tasks: SvelteTask[], row: SvelteRow, params: LayoutRowParams) {
    if (!tasks.length) {
        return;
    }

    tasks.sort(_byStartThenByLongestSortFn);

    const others: { [yPos: number]: SvelteTask[] } = {};
    const context: { [taskId: PropertyKey]: { yPos?: number; intersects?: boolean; } } = {};
    const ctx = (task: SvelteTask) => context[task.model.id] ?? (context[task.model.id] = {});

    let maxYPos = 0;

    for (const task of tasks) {
        const c = ctx(task);
        c.yPos = 0;
        let fits = false;
        while (!fits) {
            const othersAtYPos = others[c.yPos] || [];
            fits = true;
            for (const other of othersAtYPos) { // can use binary search to find this iterator
                if (_intersects(task, other)) {
                    ctx(task).intersects = ctx(other).intersects = true;
                    c.yPos++;
                    if (c.yPos > maxYPos) {
                        maxYPos = c.yPos;
                    }
                    fits = false;
                    break;
                } else {
                    continue;
                }
            }
        }

        if (!others[c.yPos]) {
            others[c.yPos] = [];
        }
        others[c.yPos].push(task);

    }

    if (params.expandRow) {
        const contentHeight = (row.model.height || params.rowHeight) - 2 * params.rowPadding;
        row.height = contentHeight * (maxYPos + 1) + 2 * params.rowPadding;
    
        for (const task of tasks) {
            const c = ctx(task);
            task.height = contentHeight;
            task.top = row.y + params.rowPadding + (task.height * c.yPos);
        }
    } else {
        row.height = row.model.height || params.rowHeight;
        const contentHeight = row.height - 2 * params.rowPadding;
    
        for (const task of tasks) {
            const c = ctx(task);
            task.height = contentHeight / (maxYPos + 1);
            task.top = row.y + params.rowPadding + (task.height * c.yPos);
        }
    }
}

/** string intersection between tasks */
function _intersects(left: SvelteTask, right: SvelteTask) {
    return (left.left + left.width) > right.left && left.left < (right.left + right.width);
}

function _byStartThenByLongestSortFn(a: SvelteTask, b: SvelteTask) {
    return (a.left - b.left) || ((b.left + b.width) - (a.left + a.width));
}