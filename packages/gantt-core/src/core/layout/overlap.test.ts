import { describe, it, expect, beforeEach } from 'vitest';

import { OverlapLayout } from './overlap';
import type { GanttBuilder } from '../../gantt.builder';
import type { SvelteTask } from '../../core/task';

describe('OverlapLayout', () => {
  let gantt: GanttBuilder;
  let layout: OverlapLayout;

  beforeEach(() => {
    gantt = mockGanttBuilder();
    layout = new OverlapLayout(gantt);
  });

  const mockGanttBuilder = (): GanttBuilder => ({
    rowStore: {
      all: [
        { id: 'row1', model: { height: 50 } },
        { id: 'row2', model: { height: undefined } },
      ],
    },
    taskStore: {
      all: [
        { id: 'task1', model: { resourceId: 'row1' }, width: 100 },
        { id: 'task2', model: { resourceId: 'row2' }, width: 150 },
      ],
    },
    options: {
      rowHeight: 40,
      rowPadding: 5,
    },
  } as unknown as GanttBuilder);

  it('should calculate row positions correctly', () => {
    const result = layout.position();

    expect(result.rowPositions).toEqual({
      row1: { y: 0, height: 50 },
      row2: { y: 50, height: 40 },
    });
  });

  it('should calculate task positions correctly', () => {
    const result = layout.position();

    expect(result.taskPositions).toEqual({
      task1: { width: 100, height: 40, top: 5 },
      task2: { width: 150, height: 30, top: 55 },
    });
  });

  it('should return undefined for tasks with invalid resourceId', () => {
    gantt.taskStore.all.push({ id: 'task3', model: { resourceId: 'invalidRow' }, width: 200 } as SvelteTask);
    
    const result = layout.position();

    expect(result.taskPositions['task3']).toBeUndefined();
  });

  it('should handle empty row and task stores', () => {
    const emptyGantt = { ...mockGanttBuilder(), rowStore: { all: [] }, taskStore: { all: [] } } as unknown as GanttBuilder;
    const emptyLayout = new OverlapLayout(emptyGantt);
    
    const result = emptyLayout.position();
    
    expect(result.rowPositions).toEqual({});
    expect(result.taskPositions).toEqual({});
  });

  it('should respect custom row heights and padding', () => {
    gantt.options.rowHeight = 60;
    gantt.options.rowPadding = 10;
    
    const result = layout.position();
    
    expect(result.rowPositions.row2.height).toBe(60);
    expect(result.taskPositions.task1.top).toBe(10);
    expect(result.taskPositions.task2.top).toBe(60);
  });

  it('should handle multiple tasks in the same row', () => {
    gantt.taskStore.all.push({ 
      id: 'task1b', 
      model: { resourceId: 'row1' }, 
      width: 120 
    } as SvelteTask);
    
    const result = layout.position();
    
    expect(result.taskPositions.task1b).toBeDefined();
    expect(result.taskPositions.task1b.top).toBe(5);
  });
});