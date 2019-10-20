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

    const MIN_DRAG_X = 2;
    const MIN_DRAG_Y = 2;

    /**
     * Applies dragging interaction to gantt elements
     */
    class Draggable {
        constructor(node, settings, provider) {
            this.dragging = false;
            this.resizing = false;
            this.resizeTriggered = false;
            this.onmousedown = (event) => {
                if (!isLeftClick(event)) {
                    return;
                }
                const { x, y } = this.provider.getPos(event);
                const currWidth = this.provider.getWidth(event);
                event.stopPropagation();
                event.preventDefault();
                const canDrag = this.dragAllowed;
                const canResize = this.resizeAllowed;
                if (canDrag || canResize) {
                    this.initialX = event.clientX;
                    this.initialY = event.clientY;
                    this.mouseStartPosX = getRelativePos(this.settings.container, event).x - x;
                    this.mouseStartPosY = getRelativePos(this.settings.container, event).y - y;
                    this.mouseStartRight = x + currWidth;
                    if (canResize && this.mouseStartPosX < this.settings.resizeHandleWidth) {
                        this.direction = 'left';
                        this.resizing = true;
                        this.settings.onDown({
                            x,
                            currWidth,
                            y,
                            resizing: true
                        });
                    }
                    else if (canResize && this.mouseStartPosX > currWidth - this.settings.resizeHandleWidth) {
                        this.direction = 'right';
                        this.resizing = true;
                        this.settings.onDown({
                            x,
                            currWidth,
                            y,
                            resizing: true
                        });
                    }
                    else if (canDrag) {
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
            };
            this.onmousemove = (event) => {
                if (!this.resizeTriggered) {
                    if (Math.abs(event.clientX - this.initialX) > MIN_DRAG_X || Math.abs(event.clientY - this.initialY) > MIN_DRAG_Y) {
                        this.resizeTriggered = true;
                    }
                    else {
                        return;
                    }
                }
                event.preventDefault();
                if (this.resizing) {
                    const mousePos = getRelativePos(this.settings.container, event);
                    const { x } = this.provider.getPos(event);
                    const currWidth = this.provider.getWidth(event);
                    if (this.direction === 'left') { //resize ulijevo
                        if (mousePos.x > x + currWidth) {
                            this.direction = 'right';
                            this.settings.onResize({
                                x: this.mouseStartRight,
                                currWidth: this.mouseStartRight - mousePos.x
                            });
                            this.mouseStartRight = this.mouseStartRight + currWidth;
                        }
                        else {
                            this.settings.onResize({
                                x: mousePos.x,
                                currWidth: this.mouseStartRight - mousePos.x
                            });
                        }
                    }
                    else if (this.direction === 'right') { //resize desno
                        if (mousePos.x <= x) {
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
                if (this.dragging) {
                    const mousePos = getRelativePos(this.settings.container, event);
                    this.settings.onDrag({
                        x: mousePos.x - this.mouseStartPosX,
                        y: mousePos.y - this.mouseStartPosY
                    });
                }
            };
            this.onmouseup = (event) => {
                const { x, y } = this.provider.getPos(event);
                const currWidth = this.provider.getWidth(event);
                if (this.resizeTriggered) {
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
            };
            this.settings = settings;
            this.provider = provider;
            this.node = node;
            node.addEventListener('mousedown', this.onmousedown, false);
        }
        get dragAllowed() {
            if (typeof (this.settings.dragAllowed) === 'function') {
                return this.settings.dragAllowed();
            }
            else {
                return this.settings.dragAllowed;
            }
        }
        get resizeAllowed() {
            if (typeof (this.settings.resizeAllowed) === 'function') {
                return this.settings.resizeAllowed();
            }
            else {
                return this.settings.resizeAllowed;
            }
        }
        destroy() {
            this.node.removeEventListener('mousedown', this.onmousedown, false);
            this.node.removeEventListener('mousemove', this.onmousemove, false);
            this.node.removeEventListener('mouseup', this.onmouseup, false);
        }
    }

    let SvelteGanttExternal;
    function drag(node, data) {
        const { gantt } = data;
        const { rowContainerElement } = gantt.store.get();
        let element = null;
        return new Draggable(node, {
            onDown: ({ x, y }) => {
            },
            onDrag: ({ x, y }) => {
                if (!element) {
                    element = data.elementContent();
                    document.body.appendChild(element);
                    data.dragging = true;
                }
                Object.assign(element.style, {
                    top: y + 'px',
                    left: x + 'px'
                });
            },
            dragAllowed: () => data.enabled,
            resizeAllowed: false,
            onDrop: ({ x, y, event }) => {
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
                    x: event.pageX,
                    y: event.pageY
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
        return data;
    };
    var SvelteGanttExternal$1 = SvelteGanttExternal;

    return SvelteGanttExternal$1;

}());
//# sourceMappingURL=svelteGanttExternal.js.map
