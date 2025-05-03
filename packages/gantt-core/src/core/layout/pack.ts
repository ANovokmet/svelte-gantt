import type { GanttBuilder } from '../../gantt.builder';
import type { SvelteRow } from '../row';
import type { SvelteTask } from '../task';
import type { Positions } from './types';

/**
 * Layouts tasks - overlapping tasks display in the same row, but shrink to not overlap with each other
 */
export class PackLayout {
  /**
   * @param gantt 
   * @param expandRow row is expanded to fit them
   */
  constructor(private gantt: GanttBuilder, private expandRow = false) {

  }

  position() {
    const result: Positions = {
      rowPositions: {},
      taskPositions: {},
    }
    this._layoutRows(result);
    return result;
  }

  _layoutRows(result: Positions) {
    const { taskStore, rowStore } = this.gantt;
    const { rowHeight } = this.gantt.options;

    let top = 0;
    for (const row of rowStore.all) {
      const taskIds = taskStore.rowTaskCache[row.id];
      const base = row.model.height || rowHeight;

      result.rowPositions[row.id] = {
        y: top,
        height: base
      };
      if (taskIds) {
        const tasks = taskIds.map(taskId => taskStore.entities[taskId]);
        this._layoutRow(tasks, row, result);
      }

      top += result.rowPositions[row.id].height;
    }
  }

  _layoutRow(tasks: SvelteTask[], row: SvelteRow, result: Positions) {
    if (!tasks.length) {
      return;
    }

    const { rowHeight, rowPadding } = this.gantt.options;

    tasks.sort(_byStartThenByLongestSortFn);

    const others: { [yPos: number]: SvelteTask[] } = {};
    const context: { [taskId: PropertyKey]: { yPos?: number; intersects?: boolean; } } = {};
    const ctx = (task: SvelteTask) => context[task.id] ?? (context[task.id] = {});

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

    if (this.expandRow) {
      const contentHeight = (row.model.height || rowHeight) - 2 * rowPadding;
      const base = contentHeight * (maxYPos + 1) + 2 * rowPadding;
      const rowPos = {
        height: base,
        y: result.rowPositions[row.id].y,
      }

      result.rowPositions[row.id] = rowPos

      for (const task of tasks) {
        const c = ctx(task);
        result.taskPositions[task.id] = {
          height: contentHeight,
          top: rowPos.y + rowPadding + (contentHeight * c.yPos!),
        }
      }
    } else {
      const base = row.model.height || rowHeight;

      const rowPos = result.rowPositions[row.id] = {
        height: base,
        y: result.rowPositions[row.id].y,
      }
      const contentHeight = base - 2 * rowPadding;

      for (const task of tasks) {
        const c = ctx(task);
        const height = contentHeight / (maxYPos + 1);
        const top = rowPos.y + rowPadding + (height * c.yPos!);

        result.taskPositions[task.id] = {
          height,
          top,
        }
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