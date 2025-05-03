import type { DragChange, Position, State } from './types';
import type { DownDropEvent } from './draggable';
import { getContext } from 'svelte';
import type { SvelteTask } from '../task';
import type { SvelteRow } from '../row';
import { scrollIfOutOfBounds, setCursor, getRowAtPoint } from '../../utils/dom';
import { isDraggable, isResizable } from '../../utils/utils';
import type { EntityKey, EntityStore } from '../store.svelte';
import type { Writable } from 'svelte/store';
import type { Column } from '../column';
import type { GanttContext, GanttContextOptions } from '../../gantt';
import type { GanttApi } from '../api';

export type RootState = Partial<{
  xDelta: number;
  yDelta: number;
  width: number;
  bWidth: number;
  widthDelta: number;
}> & State;

type Props = {
  items: { [taskId: PropertyKey]: RootState; };
  onChange: (event: { changes: DragChange[]; }) => void;
  onItemsChange: (event: { items: { [taskId: PropertyKey]: RootState; }; }) => void;
}

export class DraggableGroupBuilder {
  private props: Props;
  private _taskIds: PropertyKey[] = [];
  public root = $state<{ [taskId: PropertyKey]: RootState; }>({});

  active = $state(false);
  taskStore: EntityStore<SvelteTask, EntityKey>;
  rowStore: EntityStore<SvelteRow, EntityKey>;
  selectedTasks: Writable<{ [taskId: string]: boolean;[taskId: number]: boolean;[taskId: symbol]: boolean; }>;
  columnService: { getColumnByDate: (date: number) => Column; getColumnByPosition: (x: number) => Column; getPositionByDate(date: number): number; getDateByPosition(x: number): number; roundTo(date: number): number; };
  utils: { getPositionByDate(date: number): number; getDateByPosition(x: number): number; roundTo(date: number): number; };
  api: GanttApi;
  options: GanttContextOptions;
  gantt: GanttContext;

  constructor(props: Props) {
    this.props = props;

    const { taskStore, rowStore } = getContext('gantt');
    const gantt = getContext('gantt');
    const { api, utils, columnService } = getContext('gantt');

    this.api = api;
    this.utils = utils;
    this.columnService = columnService;
    this.selectedTasks = {}._selectedTasks;
    this.gantt = gantt;
    this.options = options;

    this.taskStore = taskStore;
    this.rowStore = rowStore;
  }

  onChange(event: { changes: DragChange[]; }) {
    this.props.onChange(event);
  }

  onItemsChange(event: { items: { [taskId: PropertyKey]: RootState; }; }) {
    this.props.onItemsChange(event);
  }

  dragAllowed(task: SvelteTask) {
    const { row, model } = task;
    return row && isDraggable(row.model) && isDraggable(model);
  }

  resizeAllowed(task: SvelteTask) {
    const { row, model } = task;
    return model.type !== 'milestone' && row && isResizable(row.model) && isResizable(model);
  }

  off(taskId: PropertyKey) {
    delete this.root[taskId];
  }

  save(start: { x: number; y: number; width: number; }, task: SvelteTask, event: DownDropEvent) {
    // triggers onmousedown
    setCursor(event.dragging ? 'move' : 'e-resize');
    const { mouseEvent } = event;
    const tasks: SvelteTask[] = [task];
    if (mouseEvent.ctrlKey) {
      for (const [taskId, isSelected] of Object.entries(this.selectedTasks)) {
        if (isSelected && taskId !== String(task.model.id)) {
          tasks.push(this.taskStore.entities[taskId]);
        }
      }
    }

    this._taskIds = [];
    for (const task of tasks) {
      this._taskIds.push(task.model.id);
      this.root[task.model.id] = {
        xDelta: task.left - start.x,
        yDelta: task.top - start.y,
        width: task.width,
        bWidth: start.width,
        widthDelta: task.width - start.width,
      };
    }
    this.onItemsChange({ items: this.root });
  }

  dropAll(event: DownDropEvent) {
    if (!event.dragging && !event.resizing) {
      return;
    }
    this.active = false;
    const changes: DragChange[] = [];
    for (const taskId of this._taskIds) {
      const state = this.root[taskId];
      const task = this.taskStore.entities[taskId];
      const isTarget = task.model.id === taskId;
      const change = this.onDropSingle({
        ...event,
        mouseEvent: {
          ...event.mouseEvent,
          clientX: event.mouseEvent.clientX + state.xDelta,
          clientY: event.mouseEvent.clientY + state.yDelta,
        },
        x: event.x + state.xDelta,
        y: event.y + state.yDelta,
        width: Math.abs((isTarget ? event.width : state.bWidth) + state.widthDelta),
      } as DownDropEvent, task);
      changes.push({
        valid: change.valid,
        task: change.task,
        targetRow: change.targetRow,
        sourceRow: change.sourceRow,
        current: change.current,
        previous: change.previous,
      });
    }

    this.onChange({ changes });
    this.root = {};
    this._taskIds = [];
    this.onItemsChange({ items: this.root });
  }

  moveAll({ x, y, width, event }: { x?: number; y?: number; width?: number; event: PointerEvent }, task: SvelteTask, state: State) {

    scrollIfOutOfBounds(event, this.gantt.mainContainer);

    if (state.dragging) {
      this.api.tasks.raise.move(task.model);
    }
    if (state.resizing) {
      this.api.tasks.raise.resize(task.model);
    }
    for (const taskId of this._taskIds) {
      // somehow update tasks to (event.x + xDelta, event.y + yDelta)
      const rootState = this.root[taskId];
      const isTarget = task.model.id === taskId;
      const event = {
        x: x != null ? x + rootState.xDelta : null,
        y: y != null ? y + rootState.yDelta : null,
        width: width != null ? Math.abs((isTarget ? width : rootState.bWidth) + rootState.widthDelta) : null, // pos.width + (width - pos.bWidth) // wDelta
      };
      this.root[taskId] = {
        ...this.root[taskId],
        ...state,
        x: event.x,
        y: event.y,
        width: event.width ?? this.root[taskId]?.width,
      };
    }
  }

  setState(id: PropertyKey, state: State) {
    this.root[id] = {
      ...this.root[id],
      ...state,
    };
  }

  mouseUp({ model }: SvelteTask) {
    setCursor('default');
    this.api.tasks.raise.moveEnd(model);
  }

  private onDropSingle(event: DownDropEvent, task: SvelteTask) {
    //row switching
    const { row, model } = task;
    const sourceRow = row;
    let targetRow: SvelteRow;
    if (event.dragging) {
      const rowId = getRowAtPoint(event.mouseEvent);
      const row = this.rowStore.entities[rowId];
      if (row && isDraggable(row.model)) {
        targetRow = row;
      }
      // target row can be null
    } else {
      // dont know about this
      targetRow = row;
    }

    this.setState(model.id, {
      dragging: false,
      resizing: false,
    });

    setTimeout(() => { // because we want to block delegated clicks on gantt after dragging
      // sets state after it has been cleared, also resulting in a wierd render
      this.setState(model.id, {
        ignoreClick: false,
      });
    });

    const newFrom = this.utils.roundTo(this.columnService.getDateByPosition(event.x));
    const newTo = this.utils.roundTo(this.columnService.getDateByPosition(event.x + event.width));
    const newLeft = this.columnService.getPositionByDate(newFrom) | 0;
    const newRight = this.columnService.getPositionByDate(newTo) | 0;

    const left = newLeft;
    const width = newRight - newLeft;
    const top = this.options.rowPadding + (targetRow?.y ?? 0);
    // get value of top from the layout


    const current: Position = {
      left,
      top,
      width,
      from: newFrom,
      to: newTo,
    }
    const previous: Position = {
      left: task.left,
      width: task.width,
      top: task.top,
      from: model.from,
      to: model.to,
    }

    return {
      valid: true,
      task,
      current,
      previous,
      dragging: event.dragging,
      resizing: event.resizing,
      sourceRow,
      targetRow,
    };
  }
}
