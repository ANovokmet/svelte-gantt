import { getContext } from 'svelte';
import type { SvelteTask } from '../task';
// import { createDraggable } from './draggable.svelte';
import { scrollIfOutOfBounds } from '../../utils/dom';
import type { DraggableGroupBuilder } from './draggable-group.builder.svelte';

export const dragAllowed: (task: SvelteTask) => boolean = null;
export const resizeAllowed: (task: SvelteTask) => boolean = null;

export type Props = {
  task: SvelteTask;
  context: DraggableGroupBuilder;
}

export class DraggableBuilder {
  props: Props;
  resizeHandleWidth: number;
  mainContainer: HTMLElement;
  rowContainer: HTMLElement;

  private _current = $derived(this.context.root[this.task.model.id]);
  private _dragging = $derived(this._current?.dragging ?? false);
  private _resizing = $derived(this._current?.resizing ?? false);
  private _ignoreClick = $derived(this._current?.ignoreClick ?? false);

  // tsret

  public state = $derived.by(() => {
    if (this._dragging || this._resizing) {
      return {
        x: this._current?.x ?? this.task.left,
        y: this._current?.y ?? this.task.top,
        width: this._current?.width ?? this.task.width,
        dragging: this._dragging,
        resizing: this._resizing
      };
    } else {
      return {
        x: this.task.left,
        y: this.task.top,
        width: this.task.width,
        dragging: this._dragging,
        resizing: this._resizing
      };
    }
  });
  public onPointerDown: (event: PointerEvent) => void;

  get context() {
    return this.props.context;
  }

  get task() {
    return this.props.task;
  }

  constructor(props: Props) {
    this.props = props;

    const { rowContainer, mainContainer } = getContext('gantt');
    const { resizeHandleWidth } = getContext('options');

    this.rowContainer = rowContainer;
    this.mainContainer = mainContainer;
    this.resizeHandleWidth = resizeHandleWidth;

    const context = this.context;

    this.onPointerDown = createDraggable({
      container: this.rowContainer,
      resizeHandleWidth: this.resizeHandleWidth,
      getX: () => this.state.x,
      getY: () => this.state.y,
      getWidth: () => this.state.width,
      dragAllowed: () => {
        const fn = dragAllowed ?? context.dragAllowed ?? (() => true);
        return fn(this.task);
      },
      resizeAllowed: () => {
        const fn = resizeAllowed ?? context.resizeAllowed ?? (() => true);
        return fn(this.task);
      },
      onDown: (event) => {
        context.save(event, this.task, event);
      },
      onMouseUp: () => {
        context.mouseUp(this.task);
      },
      onResize: (event) => {
        context.moveAll(event as any, this.task, {
          x: event.x,
          y: event.width,
          resizing: true,
          ignoreClick: true
        });
      },
      onDrag: (event) => {
        context.moveAll(event as any, this.task, {
          x: event.x,
          y: event.y,
          dragging: true,
          ignoreClick: true
        });
        scrollIfOutOfBounds(event.event, mainContainer);
      },
      onDrop: (event) => {
        context.dropAll(event);
      }
    });
  }

  destroy() {
    this.context.off(this.task.model.id);
  }
}
