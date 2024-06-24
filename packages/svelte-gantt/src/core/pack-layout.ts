import type { SvelteRow } from './row';
import type { SvelteTask } from './task';

export type LayoutParams = {
    rowHeight: number; 
    rowPadding: number; 
    expandRow?: boolean;
}

/**
 * Layouts tasks in a 'pack' or 'expand' layout:
 *  - overlapping tasks display in the same row, but shrink to not overlap with eachother
 * 
 * @param tasks 
 * @param params 
 */
export function layout(tasks: SvelteTask[], row: SvelteRow, params: LayoutParams) {
    if (!tasks.length) {
        return;
    }

    tasks.sort(_byStartThenByLongestSortFn);

    const others: { [yPos: number]: SvelteTask[] } = {};

    let maxYPos = 0;

    for (const task of tasks) {
        task.yPos = 0;
        let fits = false;
        while (!fits) {
            const othersAtYPos = others[task.yPos] || [];
            fits = true;
            for (const other of othersAtYPos) { // can use binary search to find this iterator
                if (_intersects(task, other)) {
                    task.yPos++;
                    if (task.yPos > maxYPos) {
                        maxYPos = task.yPos;
                    }
                    fits = false;
                    break;
                } else {
                    continue;
                }
            }
        }

        if (!others[task.yPos]) {
            others[task.yPos] = [];
        }
        others[task.yPos].push(task);

    }

    if (params.expandRow) {
        const contentHeight = (row.model.height || params.rowHeight) - 2 * params.rowPadding;
        row.height = contentHeight * (maxYPos + 1) + 2 * params.rowPadding;
    
        for (const task of tasks) {
            task.height = contentHeight;
            task.top = row.y + params.rowPadding + (task.height * task.yPos);
        }
    } else {
        row.height = row.model.height || params.rowHeight;
        const contentHeight = row.height - 2 * params.rowPadding;
    
        for (const task of tasks) {
            task.height = contentHeight / (maxYPos + 1);
            task.top = row.y + params.rowPadding + (task.height * task.yPos);
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
