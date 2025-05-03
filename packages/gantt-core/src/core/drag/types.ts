import type { SvelteRow } from '../row';
import type { SvelteTask } from '../task';

export type Position = {
  left: number;
  top: number;
  width: number;
  from: number;
  to: number;
}

export type DragChange = {
  valid: boolean;
  task: SvelteTask;
  current: Position;
  previous: Position;
  sourceRow: SvelteRow;
  targetRow: SvelteRow;
}

export type State = Partial<{
  dragging: boolean;
  resizing: boolean;
  x: number;
  y: number;
  width: number;
  /** @deprecated */
  ignoreClick: boolean;
}>;