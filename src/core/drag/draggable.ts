import { isLeftClick, addEventListenerOnce, getRelativePos } from "src/utils/domUtils";
import { PositionProvider, DraggableSettings } from "./interfaces";
import { SvelteGantt } from "src/core/gantt";
import { SvelteRow } from "src/core/row";
import { MIN_DRAG_Y, MIN_DRAG_X } from "src/core/constants";

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
    provider: PositionProvider;
    node: HTMLElement;
    
    constructor(node: HTMLElement, settings: DraggableSettings, provider: PositionProvider) {
        this.settings = settings;
        this.provider = provider;
        this.node = node;

        node.addEventListener('mousedown', this.onmousedown, false);
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

    onmousedown = (event: MouseEvent) => {
        if(!isLeftClick(event)){
            return;
        }

        const { x, y } = this.provider.getPos(event);
        const currWidth = this.provider.getWidth(event);

        event.stopPropagation();
        event.preventDefault();
        
        const canDrag = this.dragAllowed;
        const canResize = this.resizeAllowed;
        if(canDrag || canResize){

            this.initialX = event.clientX;
            this.initialY = event.clientY;


            this.mouseStartPosX = getRelativePos(this.settings.container, event).x - x;
            this.mouseStartPosY = getRelativePos(this.settings.container, event).y - y;
            this.mouseStartRight = x + currWidth;

            if(canResize && this.mouseStartPosX < this.settings.resizeHandleWidth) {
                this.direction = 'left';
                this.resizing = true;
                this.settings.onDown({
                    x,
                    currWidth,
                    y,
                    resizing: true
                });
            }
            else if(canResize && this.mouseStartPosX > currWidth - this.settings.resizeHandleWidth) {
                this.direction = 'right';
                this.resizing = true;
                this.settings.onDown({
                    x,
                    currWidth,
                    y,
                    resizing: true
                });
            }
            else if(canDrag) {
                this.dragging = true;
                this.settings.onDown({
                    x,
                    currWidth,
                    y,
                    dragging: true
                });
            }

            window.addEventListener('mousemove', this.onmousemove, false);
            addEventListenerOnce(window, 'mouseup', this.onmouseup);
        }
    }
    
    onmousemove = (event: MouseEvent) => {
        if(!this.resizeTriggered){
            if(Math.abs(event.clientX - this.initialX) > MIN_DRAG_X || Math.abs(event.clientY - this.initialY) > MIN_DRAG_Y){
                this.resizeTriggered = true;
            }else{
                return;
            }
        }

        event.preventDefault();
        if(this.resizing) {
            const mousePos = getRelativePos(this.settings.container, event);
            const { x } = this.provider.getPos(event);
            const currWidth = this.provider.getWidth(event);

            if(this.direction === 'left') { //resize ulijevo
                if(mousePos.x > x + currWidth) {
                    this.direction = 'right';
                    this.settings.onResize({
                        x: this.mouseStartRight,
                        currWidth: this.mouseStartRight - mousePos.x
                    });
                    this.mouseStartRight = this.mouseStartRight + currWidth;
                }
                else{
                    this.settings.onResize({
                        x: mousePos.x,
                        currWidth: this.mouseStartRight - mousePos.x
                    });
                }
            }
            else if(this.direction === 'right') {//resize desno
                if(mousePos.x <= x) {
                    this.direction = 'left';
                    this.settings.onResize({
                        x: mousePos.x,
                        currWidth: x - mousePos.x
                    });
                    this.mouseStartRight = x;
                }
                else {
                    this.settings.onResize({
                        x,
                        currWidth: mousePos.x - x
                    });
                }
            }
        }

        // mouseup
        if(this.dragging) {
            const mousePos = getRelativePos(this.settings.container, event);
            this.settings.onDrag({
                x: mousePos.x - this.mouseStartPosX,
                y: mousePos.y - this.mouseStartPosY
            });
        }
    }

    onmouseup = (event: MouseEvent) => {
        const { x, y } = this.provider.getPos(event);
        const currWidth = this.provider.getWidth(event);
        
        if(this.resizeTriggered){
            this.settings.onDrop({
                x, 
                y,
                currWidth,
                event,
                dragging: this.dragging,
                resizing: this.resizing
            });
        }

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