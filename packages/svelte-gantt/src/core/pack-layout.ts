import type { SvelteRow } from './row';
import type { SvelteTask } from './task';

/**
 * Layouts tasks in a 'pack' layout:
 *  - overlapping tasks display in the same row, but shrink to not overlap with eachother
 * 
 * @param tasks 
 * @param params 
 * 
 * TODO:: tests, optimization: update only rows that have changes, update only overlapping tasks
 */
export function layout(tasks: SvelteTask[], row: SvelteRow, params: { contentHeight: number, rowPadding: number, expandRow?: boolean; }) {
    if (!tasks.length) {
        return;
    }

    if (tasks.length === 1) {
        const task = tasks[0];
        task.top = row.y + params.rowPadding;
        task.yPos = 0;
        task.intersectsWith = [];
        task.height = params.contentHeight;
        task.topDelta = (task.yPos * task.height); // + rowPadding which is added by taskfactory;

        if (params.expandRow) {
            row.height = params.contentHeight + 2 * params.rowPadding;
        }
    }

    tasks.sort(_byStartThenByLongestSortFn);

    for(const left of tasks) {
        left.yPos = 0; // reset y positions
        left.intersectsWith = [];
        for(const right of tasks) {
            if(left !== right && _intersects(left, right)) {
                left.intersectsWith.push(right);
            }
        }
    }

    for(const task of tasks) {
        task.top = row.y + params.rowPadding;
        task.numYSlots = _getMaxIntersectsWithLength(task);

        if (params.expandRow) {
            row.height = task.numYSlots * params.contentHeight + 2 * params.rowPadding;
        }

        for (let i = 0; i < task.numYSlots!; i++) {
            if(!task.intersectsWith!.some(intersect => intersect.yPos === i)) {
                task.yPos = i;

                if (params.expandRow) {
                    task.height = params.contentHeight;
                } else {
                    task.height = (params.contentHeight / task.numYSlots!);
                }
                
                task.topDelta = (task.yPos * task.height); // + rowPadding which is added by taskfactory;
                break;
            }
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

/**
 * The maximum number of tasks a task, and the tasks task is intersecting with, task is intersecting with.
 * eg. If intersecting with 3, and one of those 3 is intersecting with 4 more, the number returned is 4, 
 * because for the layout to look good we need to squeeze the first task in slots of 4.
 * @param task 
 * @param seen 
 * @returns 
 */
function _getMaxIntersectsWithLength(task: SvelteTask, seen = new Map<SvelteTask, boolean>()) {
    seen.set(task, true);
    // if (task.numYSlots != null) {
    //     return task.numYSlots;
    // }
    let len = task.intersectsWith!.length + 1;
    for (const intersect of task.intersectsWith!.filter(i => !seen.has(i))) {
        const innerLen = _getMaxIntersectsWithLength(intersect, seen);
        if(innerLen > len) {
            len = innerLen;
        }
    }
    return len;
}