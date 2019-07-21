import { isLeftClick, addEventListenerOnce, getRelativePos } from "../../utils/domUtils";
import { PositionProvider, DraggableSettings } from "./interfaces";

export function draggable(node, settings: DraggableSettings, provider: PositionProvider) {

    const { onDown, onResize, onDrag, onDrop, dragAllowed, resizeAllowed } = settings;

    let mouseStartPosX, mouseStartPosY;
    let mouseStartRight;
    let direction;
    let dragging = false, resizing = false;
    
    const onmousedown = (event) => {
        if(!isLeftClick(event)){
            return;
        }

        const { posX, posY } = provider.getPos();
        const widthT = provider.getWidth();

        event.stopPropagation();
        event.preventDefault();
        
        const canDrag = typeof(dragAllowed) === 'function' ? dragAllowed() : dragAllowed
        const canResize = typeof(resizeAllowed) === 'function' ? resizeAllowed() : resizeAllowed
        if(canDrag || canResize){
            mouseStartPosX = getRelativePos(settings.container, event).x - posX;
            mouseStartPosY = getRelativePos(settings.container, event).y - posY;
            mouseStartRight = posX + widthT;

            if(canResize && mouseStartPosX < settings.resizeHandleWidth) {
                direction = 'left';
                resizing = true;
                onDown({
                    posX,
                    widthT,
                    posY,
                    resizing: true
                });
            }
            else if(canResize && mouseStartPosX > widthT - settings.resizeHandleWidth) {
                direction = 'right';
                resizing = true;
                onDown({
                    posX,
                    widthT,
                    posY,
                    resizing: true
                });
            }
            else if(canDrag) {
                dragging = true;
                onDown({
                    posX,
                    widthT,
                    posY,
                    dragging: true
                });
            }

            window.addEventListener('mousemove', onmousemove, false);
            addEventListenerOnce(window, 'mouseup', onmouseup);
        }
    }
    
    const onmousemove = (event) => {

        event.preventDefault();
        if(resizing) {
            const mousePos = getRelativePos(settings.container, event);
            const { posX } = provider.getPos();
            const widthT = provider.getWidth();

            if(direction === 'left') { //resize ulijevo
                if(mousePos.x > posX + widthT) {
                    direction = 'right';
                    onResize({
                        posX: mouseStartRight,
                        widthT: mouseStartRight - mousePos.x
                    });
                    mouseStartRight = mouseStartRight + widthT;
                }
                else{
                    onResize({
                        posX: mousePos.x,
                        widthT: mouseStartRight - mousePos.x
                    });
                }
            }
            else if(direction === 'right') {//resize desno
                if(mousePos.x <= posX) {
                    direction = 'left';
                    onResize({
                        posX: mousePos.x,
                        widthT: posX - mousePos.x
                    });
                    mouseStartRight = posX;
                }
                else {
                    onResize({
                        posX,
                        widthT: mousePos.x - posX
                    });
                }
            }
        }

        // mouseup
        if(dragging) {
            const mousePos = getRelativePos(settings.container, event);
            onDrag({
                posX: mousePos.x - mouseStartPosX,
                posY: mousePos.y - mouseStartPosY
            });
        }
    }

    const onmouseup = (event) => {
        const { posX, posY } = provider.getPos();
        const widthT = provider.getWidth();
        
        onDrop({
            posX, 
            posY,
            widthT,
            event,
            dragging,
            resizing
        });

        dragging = false;
        resizing = false;
        direction = null;

        window.removeEventListener('mousemove', onmousemove, false);
    }

    node.addEventListener('mousedown', onmousedown, false);

    return {
        destroy() {
            node.removeEventListener('mousedown', onmousedown, false);
            node.removeEventListener('mousemove', onmousemove, false);
            node.removeEventListener('mouseup', onmouseup, false);
        }
    }
}