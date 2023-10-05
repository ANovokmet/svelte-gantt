import { isLeftClick, addEventListenerOnce, getRelativePos } from '../../utils/dom';
import { MIN_DRAG_Y, MIN_DRAG_X } from '../constants';
import type { offsetMousePostion } from '../../utils/dom';

export interface OffsetData {
    offsetPos: { x: number | null, y: number | null };
    offsetWidth: number;
}

export interface DraggableSettings {
    onDown?(event?: DownDropEvent): void;
    onResize?(event?: ResizeEvent): void;
    onDrag?(event?: DragEvent): void;
    onMouseUp?(): void;
    onDrop?(event?: DownDropEvent | number[]): void;
    dragAllowed: (() => boolean) | boolean;
    resizeAllowed: (() => boolean) | boolean;
    container: any;
    resizeHandleWidth?: any;
    getX?: (event?: MouseEvent) => number;
    getY?: (event?: MouseEvent) => number;
    getWidth?: () => number;
    modelId?: number;
}

export interface DownDropEvent {
    mouseEvent: MouseEvent | offsetMousePostion;
    x: number;
    y: number;
    width: number;
    resizing: boolean;
    dragging: boolean;
}

export interface DragEvent {
    x: number;
    y: number;
}

export interface ResizeEvent {
    x: number;
    width: number;
}

export interface offsetPos {
    x: number | null, y: number | null
}

export type directions = 'left' | 'right' | undefined;
/**
 * Applies dragging interaction to gantt elements
 */
export class Draggable {
    mouseStartPosX: number;
    mouseStartPosY: number;
    mouseStartRight: number;

    direction: directions;
    dragging = false;
    resizing = false;

    initialX: number;
    initialY: number;
    initialW: number;
    resizeTriggered = false;

    settings: DraggableSettings;
    node: HTMLElement;

    offsetPos: offsetPos = { x: null, y: null };
    offsetWidth: number = null;
    overRezisedOffset: directions;

    constructor(node: HTMLElement, settings: DraggableSettings, offsetData?: OffsetData) {
        this.settings = settings;
        this.node = node;

        if (this.settings.modelId) {
            this.offsetPos = offsetData.offsetPos;
            this.offsetWidth = offsetData.offsetWidth;
        } else {
            node.addEventListener('mousedown', this.onmousedown, { passive: true });
        }
    }

    get dragAllowed() {
        if (typeof (this.settings.dragAllowed) === 'function') {
            return this.settings.dragAllowed();
        } else {
            return this.settings.dragAllowed;
        }
    }

    get resizeAllowed() {
        if (typeof (this.settings.resizeAllowed) === 'function') {
            return this.settings.resizeAllowed();
        } else {
            return this.settings.resizeAllowed;
        }
    }

    onmousedown = (event) => {
        const offsetEvent = { clientX: this.offsetPos.x + event.clientX, clientY: this.offsetPos.y + event.clientY }

        if (!isLeftClick(event) && !this.settings.modelId) {
            return;
        }

        if (!this.settings.modelId) {
            event.stopPropagation();
            event.preventDefault();
        }

        const canDrag = this.dragAllowed;
        const canResize = this.resizeAllowed;

        if (canDrag || canResize) {
            const x = this.settings.getX();
            const y = this.settings.getY();
            const width = this.settings.getWidth();

            this.initialX = offsetEvent.clientX;
            this.initialY = offsetEvent.clientY;

            this.mouseStartRight = x + width;

            this.mouseStartPosX = getRelativePos(this.settings.container, offsetEvent).x - x;
            this.mouseStartPosY = getRelativePos(this.settings.container, offsetEvent).y - y;

            if (canResize && this.mouseStartPosX <= this.settings.resizeHandleWidth) {
                this.direction = 'left';
                this.resizing = true;
            }

            if (canResize && this.mouseStartPosX >= width - this.offsetWidth - this.settings.resizeHandleWidth) {
                this.direction = 'right';
                this.resizing = true;
            }

            if (canDrag && !this.resizing) {
                this.dragging = true;
            }

            if ((this.dragging || this.resizing) && this.settings.onDown) {
                this.settings.onDown({
                    mouseEvent: offsetEvent,
                    x,
                    width,
                    y,
                    resizing: this.resizing,
                    dragging: this.dragging,
                });
            }

            if (!this.settings.modelId) {
                window.addEventListener('mousemove', this.onmousemove, false);
                addEventListenerOnce(window, 'mouseup', this.onmouseup);
            }
        }
    }

    onmousemove = (event: MouseEvent) => {
        const offsetEvent = { clientX: this.offsetPos.x + event.clientX, clientY: this.offsetPos.y + event.clientY }

        if (!this.resizeTriggered) {
            if (Math.abs(offsetEvent.clientX - this.initialX) > MIN_DRAG_X
                || Math.abs(offsetEvent.clientY - this.initialY) > MIN_DRAG_Y) {
                this.resizeTriggered = true;
            } else {
                return;
            }
        }

        event.preventDefault();

        if (this.resizing) {

            const mousePos = getRelativePos(this.settings.container, offsetEvent);
            const x = this.settings.getX();
            const width = this.settings.getWidth();

            let resultX: number;
            let resultWidth: number;

            if (this.direction === 'left') { //resize left
                if (this.overRezisedOffset === 'left') {
                    mousePos.x += this.offsetWidth;
                }

                if ((this.mouseStartRight - mousePos.x) <= 0) {

                    this.direction = 'right';
                    if (this.overRezisedOffset !== 'left') {
                        this.overRezisedOffset = 'right'
                    } else {
                        this.overRezisedOffset = undefined;
                    }

                    resultX = this.mouseStartRight;
                    resultWidth = this.mouseStartRight - mousePos.x;
                    this.mouseStartRight = this.mouseStartRight + width;
                }
                else {
                    resultX = mousePos.x;
                    resultWidth = this.mouseStartRight - mousePos.x;
                }
            }
            else if (this.direction === 'right') {//resize right
                if (this.overRezisedOffset === 'right') {
                    mousePos.x -= this.offsetWidth
                }

                if ((mousePos.x - x + this.offsetWidth) <= 0) {
                    this.direction = 'left';

                    if (this.overRezisedOffset !== 'right') {
                        this.overRezisedOffset = 'left'
                    } else {
                        this.overRezisedOffset = undefined;
                    }

                    resultX = mousePos.x + this.offsetWidth;
                    resultWidth = mousePos.x - x + this.offsetWidth;
                    this.mouseStartRight = x;
                }
                else {
                    resultX = x;
                    resultWidth = mousePos.x - x + this.offsetWidth;
                }
            }

            this.settings.onResize && this.settings.onResize({
                x: resultX,
                width: resultWidth
            });
        }

        // mouseup
        if (this.dragging && this.settings.onDrag) {
            const mousePos = getRelativePos(this.settings.container, offsetEvent);

            this.settings.onDrag({
                x: mousePos.x - this.mouseStartPosX,
                y: mousePos.y - this.mouseStartPosY
            });
        }
    }

    onmouseup = (event: MouseEvent) => {
        const offsetEvent = { clientX: this.offsetPos.x + event.clientX, clientY: this.offsetPos.y + event.clientY }

        const x = this.settings.getX();
        const y = this.settings.getY();
        const width = this.settings.getWidth();

        this.settings.onMouseUp && this.settings.onMouseUp();

        if (this.resizeTriggered && this.settings.onDrop) {
            this.settings.onDrop({
                mouseEvent: offsetEvent,
                x,
                y,
                width,
                dragging: this.dragging,
                resizing: this.resizing
            });
        }

        this.mouseStartPosX = null;
        this.mouseStartPosY = null;
        this.mouseStartRight = null;

        this.dragging = false;
        this.resizing = false;

        this.initialX = null;
        this.initialY = null;
        this.initialW = null;
        this.resizeTriggered = false;

        this.offsetPos = { x: null, y: null };
        this.offsetWidth = null;
        this.overRezisedOffset = undefined;

        if (!this.settings.modelId) window.removeEventListener('mousemove', this.onmousemove, false);
    }

    destroy() {
        this.node.removeEventListener('mousedown', this.onmousedown, false);
        this.node.removeEventListener('mousemove', this.onmousemove, false);
        this.node.removeEventListener('mouseup', this.onmouseup, false);
    }
}