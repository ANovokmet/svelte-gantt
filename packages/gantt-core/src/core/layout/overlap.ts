import type { GanttBuilder } from '../../gantt.builder';
import type { SvelteTask } from '../task';
import type { Positions } from './types';

/**
 * Layouts tasks - overlapping tasks display one over another
 * @param params 
 */
export class OverlapLayout {
  constructor(private gantt: GanttBuilder) {

  }

  position() {
    const { rowStore, taskStore } = this.gantt;
    let top = 0;
    const result: Positions = {
      rowPositions: {},
      taskPositions: {},
    }

    for (const row of rowStore.all) {
      // row.y = top;
      // row.height = row.model.height || this.gantt.options.rowHeight;

      const base = row.model.height || this.gantt.options.rowHeight;

      result.rowPositions[row.id] = {
        y: top,
        height: base,
      }

      top += base;

      // const reflectedTasks = rowReflectedTasks[row.id];
      // if (reflectedTasks) {
      //   for (const task of reflectedTasks) {
      //     positionTask(task);
      //   }
      // }
    }

    for (const task of taskStore.all) {
      const pos = this.getPosition(task, result);
      if (pos) {
        result.taskPositions[task.id] = pos;
      }
    }

    return result;
  }

  getPosition(task: SvelteTask, result: Positions) {
    // const row = rowStore.entities[task.model.resourceId];
    const rowPos = result.rowPositions[task.model.resourceId];
    if (!rowPos) {
      return;
    }
    const { rowPadding } = this.gantt.options;

    return {
      width: task.width,
      height: rowPos.height - 2 * rowPadding,
      top: rowPos.y + rowPadding,
    }
  }
}
