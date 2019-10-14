var SvelteGanttExternal = (function () {
    'use strict';

    function isLeftClick(event) {
        return event.which === 1;
    }
    /**
     * Gets mouse position within an element
     * @param node
     * @param event
     */
    function getRelativePos(node, event) {
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top; //y position within the element.
        return {
            x: x,
            y: y
        };
    }
    /**
     * Adds an event listener that triggers once.
     * @param target
     * @param type
     * @param listener
     * @param addOptions
     * @param removeOptions
     */
    function addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn, removeOptions);
            listener.apply(this, arguments, addOptions);
        });
    }
    //# sourceMappingURL=domUtils.js.map

    //# sourceMappingURL=componentPosProvider.js.map

    const MIN_DRAG_X = 2;
    const MIN_DRAG_Y = 2;
    //# sourceMappingURL=constants.js.map

    function draggable(node, settings, provider) {
        const { onDown, onResize, onDrag, onDrop, dragAllowed, resizeAllowed } = settings;
        let mouseStartPosX, mouseStartPosY;
        let mouseStartRight;
        let direction;
        let dragging = false, resizing = false;
        let initialX, initialY;
        let resizeTriggered = false;
        const onmousedown = (event) => {
            if (!isLeftClick(event)) {
                return;
            }
            const { posX, posY } = provider.getPos(event);
            const widthT = provider.getWidth(event);
            event.stopPropagation();
            event.preventDefault();
            const canDrag = typeof (dragAllowed) === 'function' ? dragAllowed() : dragAllowed;
            const canResize = typeof (resizeAllowed) === 'function' ? resizeAllowed() : resizeAllowed;
            if (canDrag || canResize) {
                initialX = event.clientX;
                initialY = event.clientY;
                mouseStartPosX = getRelativePos(settings.container, event).x - posX;
                mouseStartPosY = getRelativePos(settings.container, event).y - posY;
                mouseStartRight = posX + widthT;
                if (canResize && mouseStartPosX < settings.resizeHandleWidth) {
                    direction = 'left';
                    resizing = true;
                    onDown({
                        posX,
                        widthT,
                        posY,
                        resizing: true
                    });
                }
                else if (canResize && mouseStartPosX > widthT - settings.resizeHandleWidth) {
                    direction = 'right';
                    resizing = true;
                    onDown({
                        posX,
                        widthT,
                        posY,
                        resizing: true
                    });
                }
                else if (canDrag) {
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
        };
        const onmousemove = (event) => {
            if (!resizeTriggered) {
                if (Math.abs(event.clientX - initialX) > MIN_DRAG_X || Math.abs(event.clientY - initialY) > MIN_DRAG_Y) {
                    console.log('trigger resize');
                    resizeTriggered = true;
                }
                else {
                    return;
                }
            }
            event.preventDefault();
            if (resizing) {
                const mousePos = getRelativePos(settings.container, event);
                const { posX } = provider.getPos(event);
                const widthT = provider.getWidth(event);
                if (direction === 'left') { //resize ulijevo
                    if (mousePos.x > posX + widthT) {
                        direction = 'right';
                        onResize({
                            posX: mouseStartRight,
                            widthT: mouseStartRight - mousePos.x
                        });
                        mouseStartRight = mouseStartRight + widthT;
                    }
                    else {
                        onResize({
                            posX: mousePos.x,
                            widthT: mouseStartRight - mousePos.x
                        });
                    }
                }
                else if (direction === 'right') { //resize desno
                    if (mousePos.x <= posX) {
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
            if (dragging) {
                const mousePos = getRelativePos(settings.container, event);
                onDrag({
                    posX: mousePos.x - mouseStartPosX,
                    posY: mousePos.y - mouseStartPosY
                });
            }
        };
        const onmouseup = (event) => {
            const { posX, posY } = provider.getPos(event);
            const widthT = provider.getWidth(event);
            if (resizeTriggered) {
                onDrop({
                    posX,
                    posY,
                    widthT,
                    event,
                    dragging,
                    resizing
                });
            }
            dragging = false;
            resizing = false;
            direction = null;
            resizeTriggered = false;
            window.removeEventListener('mousemove', onmousemove, false);
        };
        node.addEventListener('mousedown', onmousedown, false);
        return {
            destroy() {
                node.removeEventListener('mousedown', onmousedown, false);
                node.removeEventListener('mousemove', onmousemove, false);
                node.removeEventListener('mouseup', onmouseup, false);
            }
        };
    }

    //# sourceMappingURL=index.js.map

    let SvelteGanttExternal;
    function drag(node, data) {
        const { gantt } = data;
        const { rowContainerElement } = gantt.store.get();
        let element = null;
        return draggable(node, {
            onDown: ({ posX, posY }) => {
            },
            onDrag: ({ posX, posY }) => {
                if (!element) {
                    element = data.elementContent();
                    document.body.appendChild(element);
                    data.dragging = true;
                }
                Object.assign(element.style, {
                    top: posY + 'px',
                    left: posX + 'px'
                });
            },
            dragAllowed: () => data.enabled,
            resizeAllowed: false,
            onDrop: ({ posX, posY, event }) => {
                console.log('SUCC');
                console.log(posX, posY);
                const targetRow = gantt.dndManager.getTarget('row', event);
                if (targetRow) {
                    const mousePos = getRelativePos(rowContainerElement, event);
                    const date = gantt.utils.getDateByPosition(mousePos.x);
                    data.onsuccess(targetRow, date, gantt);
                }
                else {
                    data.onfail();
                }
                document.body.removeChild(element);
                data.dragging = false;
                element = null;
            },
            container: document.body,
        }, {
            getPos: (event) => {
                console.log(event.clientX, event.clientY);
                return {
                    posX: event.pageX,
                    posY: event.pageY
                };
            },
            getWidth: () => 0
        });
    }
    SvelteGanttExternal = {};
    SvelteGanttExternal.defaults = {
        // if enabled
        enabled: true,
        // called when dragged over a row 
        onsuccess: (targetRow, dropDate, gantt) => { },
        // called when dragged outside main gantt area
        onfail: () => { },
        // factory function, creates HTMLElement 
        elementContent: () => {
            const element = document.createElement('div');
            element.innerHTML = 'New Task';
            Object.assign(element.style, {
                position: 'absolute',
                background: '#eee',
                padding: '0.5em 1em',
                fontSize: '12px',
                pointerEvents: 'none',
            });
            return element;
        },
        // gantt to bind this draggable to
        gantt: null
    };
    SvelteGanttExternal.create = function (element, options) {
        const data = Object.assign({}, SvelteGanttExternal.defaults, options);
        drag(element, data);
        /*return new SvelteGanttExternal({
            target: element,
        });*/
        return data;
    };
    var SvelteGanttExternal$1 = SvelteGanttExternal;
    //# sourceMappingURL=External.js.map

    return SvelteGanttExternal$1;

}());
//# sourceMappingURL=svelteGanttExternal.js.map
