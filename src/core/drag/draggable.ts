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

        const { posX, posY } = this.provider.getPos(event);
        const widthT = this.provider.getWidth(event);

        event.stopPropagation();
        event.preventDefault();
        
        const canDrag = this.dragAllowed;
        const canResize = this.resizeAllowed;
        if(canDrag || canResize){

            this.initialX = event.clientX;
            this.initialY = event.clientY;


            this.mouseStartPosX = getRelativePos(this.settings.container, event).x - posX;
            this.mouseStartPosY = getRelativePos(this.settings.container, event).y - posY;
            this.mouseStartRight = posX + widthT;

            if(canResize && this.mouseStartPosX < this.settings.resizeHandleWidth) {
                this.direction = 'left';
                this.resizing = true;
                this.settings.onDown({
                    posX,
                    widthT,
                    posY,
                    resizing: true
                });
            }
            else if(canResize && this.mouseStartPosX > widthT - this.settings.resizeHandleWidth) {
                this.direction = 'right';
                this.resizing = true;
                this.settings.onDown({
                    posX,
                    widthT,
                    posY,
                    resizing: true
                });
            }
            else if(canDrag) {
                this.dragging = true;
                this.settings.onDown({
                    posX,
                    widthT,
                    posY,
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
            const { posX } = this.provider.getPos(event);
            const widthT = this.provider.getWidth(event);

            if(this.direction === 'left') { //resize ulijevo
                if(mousePos.x > posX + widthT) {
                    this.direction = 'right';
                    this.settings.onResize({
                        posX: this.mouseStartRight,
                        widthT: this.mouseStartRight - mousePos.x
                    });
                    this.mouseStartRight = this.mouseStartRight + widthT;
                }
                else{
                    this.settings.onResize({
                        posX: mousePos.x,
                        widthT: this.mouseStartRight - mousePos.x
                    });
                }
            }
            else if(this.direction === 'right') {//resize desno
                if(mousePos.x <= posX) {
                    this.direction = 'left';
                    this.settings.onResize({
                        posX: mousePos.x,
                        widthT: posX - mousePos.x
                    });
                    this.mouseStartRight = posX;
                }
                else {
                    this.settings.onResize({
                        posX,
                        widthT: mousePos.x - posX
                    });
                }
            }
        }

        // mouseup
        if(this.dragging) {
            const mousePos = getRelativePos(this.settings.container, event);
            this.settings.onDrag({
                posX: mousePos.x - this.mouseStartPosX,
                posY: mousePos.y - this.mouseStartPosY
            });
        }
    }

    onmouseup = (event: MouseEvent) => {
        const { posX, posY } = this.provider.getPos(event);
        const widthT = this.provider.getWidth(event);
        
        if(this.resizeTriggered){
            this.settings.onDrop({
                posX, 
                posY,
                widthT,
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

export type DropHandler = (event: MouseEvent) => any;

export class DragDropManager
{
    gantt: SvelteGantt;
    handlerMap: {[key:string]: DropHandler} = {};

    constructor(gantt) {
        this.gantt = gantt;
        
        this.register('row', (event) => {
            let elements = document.elementsFromPoint(event.clientX, event.clientY);
            let rowElement = elements.find((element) => !!element.getAttribute("data-row-id"));
            if(rowElement !== undefined) {
                const rowId = parseInt(rowElement.getAttribute("data-row-id"));
                const { rowMap } = this.gantt.store.get();
                const targetRow = rowMap[rowId];

                if(targetRow.model.enableDragging){
                    return targetRow;
                }
            }
            return null;
        });
    }

    register(target: string, handler: DropHandler) {
        this.handlerMap[target] = handler;
    }

    getTarget(target: string, event: MouseEvent): SvelteRow {
        //const rowCenterX = this.root.refs.mainContainer.getBoundingClientRect().left + this.root.refs.mainContainer.getBoundingClientRect().width / 2;
        var handler = this.handlerMap[target];
        if(handler){
            return handler(event);
        }
    }
}