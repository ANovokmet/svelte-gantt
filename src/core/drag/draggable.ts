import { isLeftClick, addEventListenerOnce, getRelativePos } from '../../utils/domUtils';
import { MIN_DRAG_Y, MIN_DRAG_X } from '../constants';
import type { offsetMousePostion } from '../../utils/domUtils'

export interface DraggableSettings {
    onDown?(event?: DownDropEvent): void; 
    onResize?(event?: ResizeEvent): void;
    onDrag?(event?: DragEvent): void;
    onMouseUp?(): void;
    onDrop(event?: DownDropEvent): void; 
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

/**
 * Applies dragging interaction to gantt elements
 */
export class Draggable {
    mouseStartPosX: number;
    mouseStartPosY: number;
    mouseStartRight: number;
    direction: 'left' | 'right';
    dragging = false;
    resizing = false;
    
    initialX: number;
    initialY: number;
    initialW: number;
    resizeTriggered = false;

    settings: DraggableSettings;
    node: HTMLElement;

    offsetPos: offsetPos = {x: null, y: null};
    offsetWidth: number = null;
    
    constructor(node: HTMLElement, settings: DraggableSettings, type?: string) {
        this.settings = settings;
        this.node = node;
        
        //EventListeners for resizer + timeranges only, selectionsmanager calls the task dragable instance directly
        switch(type) {
            case 'resizer':
            case 'timerange':
                node.addEventListener('mousedown', this.onmousedown, false);
        }
    }

    get dragAllowed() {
        if(typeof(this.settings.dragAllowed) === 'function') {
            return this.settings.dragAllowed();
        } else {
            return this.settings.dragAllowed;
        }
    }

    get resizeAllowed() {
        if(typeof(this.settings.resizeAllowed) === 'function') {
            return this.settings.resizeAllowed();
        } else {
            return this.settings.resizeAllowed;
        }
    }

    onmousedown = (event) => {
        if(!isLeftClick(event) && !event.isOffsetMouseEvent){
            return;
        }

        if (!event.isOffsetMouseEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        const canDrag = this.dragAllowed;
        const canResize = this.resizeAllowed;

        if(canDrag || canResize){
            const x = this.settings.getX();
            const y = this.settings.getY();
            const width = this.settings.getWidth();

            this.initialX = event.clientX;
            this.initialY = event.clientY;

            this.mouseStartRight = x + width;

            this.mouseStartPosX = getRelativePos(this.settings.container, event).x - x;
            this.mouseStartPosY = getRelativePos(this.settings.container, event).y - y;

            if (!event.isOffsetMouseEvent) {
                if(canResize && this.mouseStartPosX < this.settings.resizeHandleWidth) {
                    this.direction = 'left';
                    this.resizing = true;
                }
                if(canResize && this.mouseStartPosX > width - this.settings.resizeHandleWidth) {
                    this.direction = 'right';
                    this.resizing = true;
                }

            }

            if(canDrag && !this.resizing) {
                this.dragging = true;
            }

            if((this.dragging || this.resizing) && this.settings.onDown) {
                this.settings.onDown({
                    mouseEvent: event,
                    x,
                    width,
                    y,
                    resizing: this.resizing,
                    dragging: this.dragging,
                });
            }

            window.addEventListener('mousemove', this.onmousemove, false);
            addEventListenerOnce(window, 'mouseup', this.onmouseup);
        }
    }
    
    onmousemove = (event: MouseEvent) => {
        const offsetEvent = {clientX: this.offsetPos.x + event.clientX, clientY: this.offsetPos.y + event.clientY}

         if(!this.resizeTriggered){
            if(Math.abs(offsetEvent.clientX - this.initialX) > MIN_DRAG_X 
            || Math.abs(offsetEvent.clientY - this.initialY) > MIN_DRAG_Y){
                this.resizeTriggered = true;
            }else{
                return;
            }
        }

        event.preventDefault();

        if(this.resizing) {
            const mousePos = getRelativePos(this.settings.container, offsetEvent);
            const x = this.settings.getX();
            const width = this.settings.getWidth();

            let resultX: number;
            let resultWidth: number;

            if(this.direction === 'left') { //resize left
                if(mousePos.x > x + width) {
                    this.direction = 'right';
                    resultX = this.mouseStartRight;
                    resultWidth = this.mouseStartRight - mousePos.x;
                    this.mouseStartRight = this.mouseStartRight + width;
                }
                else{
                    resultX = mousePos.x;
                    resultWidth = this.mouseStartRight - mousePos.x;
                }
            }
            else if(this.direction === 'right') {//resize right
                if(mousePos.x <= x) {
                    this.direction = 'left';
                    resultX = mousePos.x;
                    resultWidth = x - mousePos.x + this.offsetWidth;
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
        if(this.dragging && this.settings.onDrag) {
            const mousePos = getRelativePos(this.settings.container, offsetEvent);

            this.settings.onDrag({
                x: mousePos.x - this.mouseStartPosX,
                y: mousePos.y - this.mouseStartPosY
            });
        }
    }

    onmouseup = (event: MouseEvent) => {
        const offsetEvent = {clientX: this.offsetPos.x + event.clientX, clientY: this.offsetPos.y + event.clientY}
        const x = this.settings.getX();
        const y = this.settings.getY();
        const width = this.settings.getWidth();

        this.settings.onMouseUp && this.settings.onMouseUp();

        if(this.resizeTriggered && this.settings.onDrop){
            this.settings.onDrop({
                    mouseEvent: offsetEvent,
                    x, 
                    y,
                    width,
                    dragging: this.dragging,
                    resizing: this.resizing
                });
            }

        this.offsetPos = {x: null, y: null};
        this.offsetWidth = null;
        this.dragging = false;
        this.resizing = false;
        this.direction = null;
        this.resizeTriggered = false;

        window.removeEventListener('mousemove', this.onmousemove, false);
    }
    
    destroy() {
        this.node.removeEventListener('mousedown', this.onmousedown, false);
        this.node.removeEventListener('mousemove', this.onmousemove, false);
        this.node.removeEventListener('mouseup', this.onmouseup, false);
    }
}