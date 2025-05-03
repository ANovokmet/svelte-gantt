import { isLeftClick, addEventListenerOnce, getRelativePos } from '../../utils/dom';
import { MIN_DRAG_Y, MIN_DRAG_X } from '../constants';
import { extract } from 'src/utils/getters';

export interface DraggableOptions {
  container: HTMLElement;
  dragAllowed: MaybeAccessor<boolean>;
  resizeAllowed: MaybeAccessor<boolean>;
  resizeHandleWidth?: number;
  getX?: (event?: MouseEvent) => number;
  getY?: (event?: MouseEvent) => number;
  getWidth?: () => number;

  onDown?(event?: DownDropEvent): void;
  onResize?(event?: ResizeEvent): void;
  onDrag?(event?: DragEvent): void;
  onMouseUp?(): void;
  onDrop?(event?: DownDropEvent): void;
}

export interface DownDropEvent {
  mouseEvent: MouseEvent;
  x: number;
  y: number;
  width: number;
  resizing: boolean;
  dragging: boolean;
}

export interface DragEvent {
  x: number;
  y: number;
  event?: MouseEvent;
}

export interface ResizeEvent {
  x: number;
  width: number;
  event?: MouseEvent;
}

export type Direction = 'left' | 'right' | undefined;

type MaybeAccessor<T> = T | (() => T);

function getAccessor<T>(accessor: MaybeAccessor<T>): () => T {
  if (accessor instanceof Function) {
    return () => accessor();
  } else {
    return () => accessor;
  }
}

type Props = {
  id: string;
  nodeRef?: HTMLElement;
  container?: HTMLElement;
  onDrop?(event?: DropEvent): void;

  dragAllowed: MaybeAccessor<boolean>;
  resizeAllowed: MaybeAccessor<boolean>;
  resizeHandleWidth?: number;

  state: MaybeAccessor<DraggableState>;
  onStateChange(state: DraggableState);
}

type DraggableState = {
  transform: Transform | null;
  dragging: boolean;
  resizing: boolean;
}

type Transform = { x: number; y: number; width: number; };

type DraggableOutput = {
  ref(e: HTMLElement): void;
  readonly transform: { x: number; y: number; width: number; } | null | undefined;
  readonly attrs: Record<string, boolean | ''>;
  readonly listeners: Record<string, (e: Event) => void>;
}

/**
 * Applies dragging interaction to gantt elements
 */
export function createDraggableBuilder(options: Props): DraggableOutput {
  // const context = getDraggableContext();
  let direction: Direction;
  let triggered = false;

  const state = () => extract(options.state, {
    transform: null,
    dragging: false,
    resizing: false,
  });

  function onStateChange(e: Partial<DraggableState>) {
    options.onStateChange({ ...state(), ...e });
  }

  const dragAllowed = getAccessor(options.dragAllowed);
  const resizeAllowed = getAccessor(options.resizeAllowed);

  let anchor: { left: number; right: number; } = null;
  let relative: { x: number; y: number; } = null;
  let initial: { x: number; y: number; } = null;

  const container = () => options.container /*?? context.container*/ ?? document.querySelector('[data-sg-row-container]');

  function onMousedown(event: PointerEvent) {
    if (!isLeftClick(event)) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();

    const canDrag = dragAllowed();
    const canResize = resizeAllowed();
    if (!canDrag && !canResize) {
      return;
    }

    const pointer = getRelativePos(container(), event);
    relative = getRelativePos(options.nodeRef, event);
    const rect = options.nodeRef.getBoundingClientRect(); // TODO:: less calls of this

    const x = pointer.x - relative.x;
    const y = pointer.y - relative.y;
    const width = rect.width;

    initial = { x: event.clientX, y: event.clientY };
    anchor = { left: x, right: x + width };

    let resizing = false;
    let dragging = false;

    if (canResize && relative.x <= options.resizeHandleWidth) {
      direction = 'left';
      resizing = true;
    }

    if (canResize && relative.x >= width - options.resizeHandleWidth) {
      direction = 'right';
      resizing = true;
    }

    if (canDrag && !resizing) {
      dragging = true;
    }

    if (dragging || resizing) {
      onStateChange({
        transform: {
          x, y, width,
        },
        dragging,
        resizing,
      });

      // context?.setActiveItem({
      //   id: options.id,
      //   get transform() { return state().transform; },
      // });
    }

    window.addEventListener('pointermove', onMousemove, false);
    addEventListenerOnce(window, 'pointerup', onMouseup);
  };

  function onMousemove(event: MouseEvent) {
    if (!triggered) {
      if (
        Math.abs(event.clientX - initial.x) > MIN_DRAG_X ||
        Math.abs(event.clientY - initial.y) > MIN_DRAG_Y
      ) {
        triggered = true;
      } else {
        return;
      }
    }

    event.preventDefault();

    if (state().resizing) {
      const pointer = getRelativePos(container(), event);

      let x: number;
      let width: number;

      if (direction === 'left') {
        if (anchor.right - pointer.x < 0) {
          direction = 'right';
          anchor = {
            left: anchor.right,
            right: pointer.x
          };
          x = anchor.left;
          width = anchor.left - pointer.x;
        } else {
          x = pointer.x;
          width = anchor.right - pointer.x;
        }
      } else if (direction === 'right') {
        if (pointer.x - anchor.left < 0) {
          direction = 'left';
          anchor = {
            left: pointer.x,
            right: anchor.left
          }
          x = pointer.x;
          width = anchor.right - pointer.x;
        } else {
          x = anchor.left;
          width = pointer.x - anchor.left;
        }
      }

      // state().transform.x = x;
      // state().transform.width = width;

      onStateChange({
        transform: {
          ...state().transform,
          x, width,
        },
      });
    }

    if (state().dragging) {
      const mousePos = getRelativePos(container(), event);

      // state().transform.x = mousePos.x - relative.x; // maybe this is the rounding error
      // state().transform.y = mousePos.y - relative.y;

      const x = mousePos.x - relative.x; // maybe this is the rounding error
      const y = mousePos.y - relative.y;
      
      onStateChange({
        transform: {
          ...state().transform,
          x, y,
        },
      });
    }
  };

  function onMouseup(event: MouseEvent) {
    onMousemove(event); // ? do we do this
    // const pointer = getRelativePos(options.container, event);
    // const x = pointer.x - relative.x;
    // const y = pointer.y - relative.y;
    // const width = pointer.x - anchor.left;
    const { x, y, width } = state().transform;

    // there is an issue here maybe, we update task according to the mousemove event, but we ignore the mouseup event and use the previously commited x, y and width
    // you know those issues when task gets rounded incorrectly on resize? could be the cause
    // ....or not really, this issue results in task resizing when task is merely dragged
    if (triggered) {
      // state().transform = null;
      const data: DropEvent = {
        event,
        id: options.id,
        x,
        y,
        width,
        dragging: state().dragging,
        resizing: state().resizing
      }
      // context?.onDrop(data);
      options?.onDrop(data);
    }

    relative = null;
    anchor = null;

    // state().dragging = false;
    // state().resizing = false;

    onStateChange({
      transform: null,
      dragging: false,
      resizing: false,
    });

    initial = null;
    triggered = false;

    window.removeEventListener('pointermove', onMousemove, false);
  };

  // TODO:: return some kind of global state hook, we want to match by ID for timeranges

  return {
    ref(e: HTMLElement) {
      options.nodeRef = e;
    },
    // get transform() { return context ? context.getTransform(options.id) : state().transform; }, // time ranges need context too
    get transform() { return state().transform; }, // time ranges need context too
    get listeners() {
      return {
        onmousedown: onMousedown,
      }
    },
    get attrs() {
      return {
        'data-moving': state().dragging || state().resizing || undefined,
        'data-dragging': state().dragging || undefined,
        'data-resizing': state().resizing || undefined,
      };
    }
  };
}


export type DropEvent = {
  event: MouseEvent;
  id: PropertyKey;
  x: number;
  y: number;
  width: number;
  resizing: boolean;
  dragging: boolean;
}

// type GroupProps = {
//   container: HTMLElement;
//   onDrop?(event: DropEvent): void;
// }

// type DraggableContext = {
//   container: HTMLElement | undefined;
//   setActiveItem(item: ActiveDraggable): void;
//   onDrop(event: DropEvent): void;
//   getTransform(id: PropertyKey): Transform | null;
// }

// const CONTEXT = Symbol('draggable-context');

// export function getDraggableContext() {
//   return getContext(CONTEXT) as DraggableContext;
// }

// type ActiveDraggable = {
//   id: string;
//   readonly transform: Transform;
// }

// export function createDraggableGroupBuilder(props: GroupProps) {
//   let activeItem = $state<ActiveDraggable | null>(null);
//   const context: DraggableContext = {
//     get container() { return props.container; },
//     setActiveItem(item: ActiveDraggable) {
//       activeItem = item;
//     },
//     onDrop(event) {
//       props?.onDrop(event);
//     },
//     getTransform(id: PropertyKey) {
//       return activeItem?.id === id ? activeItem.transform : null;
//     }
//   }

//   setContext(CONTEXT, context);

//   return {

//   };
// }