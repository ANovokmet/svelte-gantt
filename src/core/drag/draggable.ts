import { isLeftClick, addEventListenerOnce, getRelativePos } from '../../utils/dom';
import { MIN_DRAG_Y, MIN_DRAG_X } from '../constants';

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

export type Directions = 'left' | 'right' | undefined;

type MaybeAccessor<T> = T | (() => T);

function getAccessor<T>(accessor: MaybeAccessor<T>): () => T {
    if (accessor instanceof Function) {
        return () => accessor();
    } else {
        return () => accessor;
    }
}

/**
 * Applies dragging interaction to gantt elements
 */
export function useDraggable(node: HTMLElement, options: DraggableOptions) {
    let mouseStartPosX: number;
    let mouseStartPosY: number;
    let mouseStartRight: number;

    let direction: Directions;
    let dragging = false;
    let resizing = false;

    let initialX: number;
    let initialY: number;
    let resizeTriggered = false;

    const dragAllowed = getAccessor(options.dragAllowed);
    const resizeAllowed = getAccessor(options.resizeAllowed);

    node.addEventListener('mousedown', onMousedown, { passive: true });

    function onMousedown(event: MouseEvent) {
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

        const x = options.getX(event);
        const y = options.getY(event);
        const width = options.getWidth();

        initialX = event.clientX;
        initialY = event.clientY;

        mouseStartRight = x + width;

        mouseStartPosX = getRelativePos(options.container, event).x - x;
        mouseStartPosY = getRelativePos(options.container, event).y - y;

        if (canResize && mouseStartPosX <= options.resizeHandleWidth) {
            direction = 'left';
            resizing = true;
        }

        if (canResize && mouseStartPosX >= width - options.resizeHandleWidth) {
            direction = 'right';
            resizing = true;
        }

        if (canDrag && !resizing) {
            dragging = true;
        }

        if ((dragging || resizing) && options.onDown) {
            options.onDown({
                mouseEvent: event,
                x,
                width,
                y,
                resizing: resizing,
                dragging: dragging
            });
        }

        window.addEventListener('mousemove', onMousemove, false);
        addEventListenerOnce(window, 'mouseup', onMouseup);
    };

    function onMousemove(event: MouseEvent) {
        if (!resizeTriggered) {
            if (
                Math.abs(event.clientX - initialX) > MIN_DRAG_X ||
                Math.abs(event.clientY - initialY) > MIN_DRAG_Y
            ) {
                resizeTriggered = true;
            } else {
                return;
            }
        }

        event.preventDefault();

        if (resizing) {
            const mousePos = getRelativePos(options.container, event);
            const x = options.getX(event);
            const width = options.getWidth();

            let resultX: number;
            let resultWidth: number;

            if (direction === 'left') {
                if (mouseStartRight - mousePos.x <= 0) {
                    direction = 'right';

                    resultX = mouseStartRight;
                    resultWidth = mouseStartRight - mousePos.x;
                    mouseStartRight = mouseStartRight + width;
                } else {
                    resultX = mousePos.x;
                    resultWidth = mouseStartRight - mousePos.x;
                }
            } else if (direction === 'right') {
                //resize right
                if (mousePos.x - x <= 0) {
                    direction = 'left';
                    resultX = mousePos.x;
                    resultWidth = mousePos.x - x;
                    mouseStartRight = x;
                } else {
                    resultX = x;
                    resultWidth = mousePos.x - x;
                }
            }

            if (options.onResize) {
                options.onResize({
                    x: resultX,
                    width: resultWidth,
                    event
                });
            }
        }

        // mouseup
        if (dragging && options.onDrag) {
            const mousePos = getRelativePos(options.container, event);

            options.onDrag({
                x: mousePos.x - mouseStartPosX,
                y: mousePos.y - mouseStartPosY,
                event
            });
        }
    };

    function onMouseup(event: MouseEvent) {
        const x = options.getX(event);
        const y = options.getY(event);
        const width = options.getWidth();

        options.onMouseUp && options.onMouseUp();

        if (resizeTriggered && options.onDrop) {
            options.onDrop({
                mouseEvent: event,
                x,
                y,
                width,
                dragging: dragging,
                resizing: resizing
            });
        }

        mouseStartPosX = null;
        mouseStartPosY = null;
        mouseStartRight = null;

        dragging = false;
        resizing = false;

        initialX = null;
        initialY = null;
        resizeTriggered = false;

        window.removeEventListener('mousemove', onMousemove, false);
    };

    return {
        destroy() {
            node.removeEventListener('mousedown', onMousedown, false);
            node.removeEventListener('mousemove', onMousemove, false);
            node.removeEventListener('mouseup', onMouseup, false);
        }
    };
}