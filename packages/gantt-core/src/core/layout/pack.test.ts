import { describe, expect, it } from 'vitest';

import type { SvelteRow } from '../row';
import type { SvelteTask } from '../../core/task';
import type { GanttBuilder } from '../../gantt.builder';
import { PackLayout } from './pack';

describe('PackLayout', () => {
  const mockGanttBuilder = (rows: SvelteRow[], tasks: SvelteTask[], options: any): GanttBuilder => {
    const rowStore = {
      all: rows,
    };
    const taskStore = {
      rowTaskCache: rows.reduce((cache, row) => {
        cache[row.id] = tasks.filter(task => task.model.resourceId === row.id).map(task => task.id);
        return cache;
      }, {} as Record<PropertyKey, PropertyKey[]>),
      entities: tasks.reduce((entities, task) => {
        entities[task.id] = task;
        return entities;
      }, {} as Record<PropertyKey, SvelteTask>),
    };
    return {
      rowStore,
      taskStore,
      options,
    } as unknown as GanttBuilder;
  };

  it('should calculate positions for rows and tasks without overlapping', () => {
    const rows = [
      { id: 'row1', model: { height: 50 } } as SvelteRow,
    ];
    const tasks = [
      { id: 'task1', left: 0, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
      { id: 'task2', left: 60, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
    ];
    const options = { rowHeight: 50, rowPadding: 5 };
    const gantt = mockGanttBuilder(rows, tasks, options);

    const layout = new PackLayout(gantt);
    const result = layout.position();

    expect(result.rowPositions['row1']).toEqual({ y: 0, height: 50 });
    expect(result.taskPositions['task1']).toEqual({ height: 40, top: 5 });
    expect(result.taskPositions['task2']).toEqual({ height: 40, top: 5 });
  });

  it('should stack overlapping tasks in the same row', () => {
    const rows = [
      { id: 'row1', model: { height: 50 } } as SvelteRow,
    ];
    const tasks = [
      { id: 'task1', left: 0, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
      { id: 'task2', left: 30, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
    ];
    const options = { rowHeight: 50, rowPadding: 5 };
    const gantt = mockGanttBuilder(rows, tasks, options);

    const layout = new PackLayout(gantt);
    const result = layout.position();

    expect(result.rowPositions['row1']).toEqual({ y: 0, height: 50 });
    expect(result.taskPositions['task1']).toEqual({ height: 20, top: 5 });
    expect(result.taskPositions['task2']).toEqual({ height: 20, top: 25 });
  });

  it('should expand row height when expandRow is true', () => {
    const rows = [
      { id: 'row1', model: { height: 50 } } as SvelteRow,
    ];
    const tasks = [
      { id: 'task1', left: 0, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
      { id: 'task2', left: 30, width: 50, model: { resourceId: 'row1' } } as SvelteTask,
    ];
    const options = { rowHeight: 50, rowPadding: 5 };
    const gantt = mockGanttBuilder(rows, tasks, options);

    const layout = new PackLayout(gantt, true);
    const result = layout.position();
    expect(result.rowPositions['row1']).toEqual({ y: 0, height: 90 });
    expect(result.taskPositions['task1']).toEqual({ height: 40, top: 5 });
    expect(result.taskPositions['task2']).toEqual({ height: 40, top: 45 });
  });

  it('should handle rows with no tasks', () => {
    const rows = [
      { id: 'row1', model: { height: 50 } } as SvelteRow,
    ];
    const tasks: SvelteTask[] = [];
    const options = { rowHeight: 50, rowPadding: 5 };
    const gantt = mockGanttBuilder(rows, tasks, options);

    const layout = new PackLayout(gantt);
    const result = layout.position();

    expect(result.rowPositions['row1']).toEqual({ y: 0, height: 50 });
    expect(result.taskPositions).toEqual({});
  });
});