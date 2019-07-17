import { DOMUtils } from "../../utils/domUtils";
import { PositionProvider, DraggableSettings } from "./interfaces";

export function draggable(node, settings: DraggableSettings, provider: PositionProvider) {

    const { onDown, onResize, onDrag, onDrop, dragAllowed, resizeAllowed } = settings;

    let mouseStartPosX, mouseStartPosY;
    let mouseStartRight;
    let direction;
    let dragging = false, resizing = false;
    
    const onmousedown = (event) => {
        if(!DOMUtils.isLeftClick(event)){
            return;
        }

        const { posX, posY } = provider.getPos();
        const widthT = provider.getWidth();

        event.stopPropagation();
        event.preventDefault();
        
        const canDrag = typeof(dragAllowed) === 'function' ? dragAllowed() : dragAllowed
        const canResize = typeof(resizeAllowed) === 'function' ? resizeAllowed() : resizeAllowed
        if(canDrag || canResize){
            mouseStartPosX = DOMUtils.getRelativePos(settings.container, event).x - posX;
            mouseStartPosY = DOMUtils.getRelativePos(settings.container, event).y - posY;
            mouseStartRight = posX + widthT;

            if(canResize && mouseStartPosX < settings.resizeHandleWidth) {
                direction = 'left';
                resizing = true;
                onDown({
                    posX,
                    widthT,
                    posY
                });
            }
            else if(canResize && mouseStartPosX > widthT - settings.resizeHandleWidth) {
                direction = 'right';
                resizing = true;;
                onDown({
                    posX,
                    widthT,
                    posY
                });
            }
            else if(canDrag) {
                dragging = true;
                onDown({
                    posX,
                    widthT,
                    posY
                });
            }

            window.addEventListener('mousemove', onmousemove, false);
            DOMUtils.addEventListenerOnce(window, 'mouseup', onmouseup);
        }
    }
    
    const onmousemove = (event) => {

        event.preventDefault();
        if(resizing) {
            const mousePos = DOMUtils.getRelativePos(settings.container, event);
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
            const mousePos = DOMUtils.getRelativePos(settings.container, event);
            onDrag({
                posX: mousePos.x - mouseStartPosX,
                posY: mousePos.y - mouseStartPosY
            });
            console.log("post ondrag", provider.getPos().posX, provider.getPos().posY)
        }
    }

    const onmouseup = (event) => {
        const { posX, posY } = provider.getPos();
        const widthT = provider.getWidth();
        
        dragging = false;
        resizing = false;
        direction = null;

        onDrop({
            posX, 
            posY,
            widthT,
            event
        });

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