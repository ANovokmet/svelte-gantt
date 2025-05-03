import { GanttBuilder } from '../gantt.builder';
import type { SvelteRow } from './row';
import type { Selection } from './selection';

export interface TaskModel {
  /** id of task, every task needs to have a unique one */
  id: PropertyKey;
  resourceId: PropertyKey;
  /** date task starts on */
  from: number; // date
  /** date task ends on */
  to: number; // date

  /**
   * completion %, indicated on task
   * @deprecated
   */
  amountDone?: number;

  /** css classes */
  classes?: string | string[];
  /** label of task */
  label?: string;

  /** html content of task, will override label */
  html?: string;

  /**  
   * show button bar 
   * @deprecated 
   **/
  showButton?: boolean;

  /**  
   * button classes, useful for fontawesome icons 
   * @deprecated 
   **/
  buttonClasses?: string | string[];

  /**
   * html content of button
   * @deprecated 
   */
  buttonHtml?: string;

  /** 
   * enable dragging of task
   * @deprecated use draggable
   **/
  enableDragging?: boolean;
  /** 
   * enable dragging of task
   **/
  draggable?: boolean;
  /** 
   * enable resizing of task
   * @deprecated use resizable
   */
  enableResize?: boolean;
  /** 
   * enable resizing of task
   */
  resizable?: boolean;

  /**  
   * label displayed below
   * @deprecated 
   **/
  labelBottom?: string;
  type?: 'milestone' | 'task';
  stickyLabel?: boolean;
}

export interface SvelteTask {
  id: PropertyKey;
  model: TaskModel;

  left: number;
  top: number;
  width: number;

  height: number;

  /* tree fields */
  reflected?: boolean;
  reflectedOnParent?: boolean;
  reflectedOnChild?: boolean;
  originalId?: PropertyKey;

  readonly selected: boolean;
  readonly row: SvelteRow | undefined;
}

type CreateTaskParams = {
  rowPadding: number;
  rowEntities: { [rowId: PropertyKey]: SvelteRow };
  selection: Selection;
  getPositionByDate(date: number): number;
}

export function createTaskFactory(params: CreateTaskParams) {
  return {
    createTask: (model: TaskModel) => createTask(model, params),
    reflectTask: (task: SvelteTask, targetRow: SvelteRow) => reflectTask(task, targetRow, params),
  }
}

export class TaskFactory {
  constructor(private gantt: GanttBuilder) {

  }

  createTask(model: TaskModel): SvelteTask {
    const left = this.gantt.columnService.getPositionByDate(model.from) ?? 0;
    const right = this.gantt.columnService.getPositionByDate(model.to) ?? 0;
    const gantt = this.gantt;
  
    const row = () => this.gantt.rowStore.entities[model.resourceId];
    // const top = (row()?.y ?? -1000) + this.gantt.options.rowPadding;
    const selected = () => this.gantt.selection.state[model.id];

    const task: SvelteTask = {
      id: String(model.id),
      model,
      get left() {
        return left;
      },
      width: right - left,
      get height() {
        return gantt.getLayout().taskPositions[model.id]?.height;
        // return (row()?.height ?? 0) - 2 * gantt.options.rowPadding;
      },
      get top() {
        return gantt.getLayout().taskPositions[model.id]?.top;
        // return top;
      },
      get row() {
        return row();
      },
      get selected() {
        return selected();
      },
    }
  
    return task;
  }
}

export function createTask(model: TaskModel, params: CreateTaskParams): SvelteTask {
  const left = params.getPositionByDate(model.from) | 0;
  const right = params.getPositionByDate(model.to) | 0;

  const row = params.rowEntities[model.resourceId];
  const height = (row?.height ?? 0) - 2 * params.rowPadding;
  const top = (row ? row.y : -1000) + params.rowPadding;

  return {
    id: String(model.id),
    model,
    left: left,
    width: right - left,
    height,
    top,
    get row() {
      return params.rowEntities[model.resourceId];
    },
    get selected() {
      return params.selection.state[model.id];
    },
  };
}

export function overlap(left: SvelteTask, right: SvelteTask) {
  return !(left.left + left.width <= right.left || left.left >= right.left + right.width);
}

export function reflectTask(task: SvelteTask, targetRow: SvelteRow, params: CreateTaskParams): SvelteTask {
  const reflectedId = `reflected-task-${String(task.model.id)}-${String(targetRow.model.id)}`;

  const model = {
    ...task.model,
    resourceId: targetRow.model.id,
    id: reflectedId as PropertyKey,
    enableDragging: false
  };

  return {
    ...task,
    model,
    top: targetRow.y + params.rowPadding,
    reflected: true,
    reflectedOnParent: false,
    reflectedOnChild: true,
    originalId: task.model.id
  };
}
