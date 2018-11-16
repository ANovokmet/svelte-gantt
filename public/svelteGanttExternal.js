var SvelteGanttExternal = (function () {
    'use strict';

    class DOMUtils {
        isTaskVisible() {

        }
        
        isRowVisible() {

        }

        //get mouse position within the element
        static getRelativePos(node, event) {
            const rect = node.getBoundingClientRect();
            const x = event.clientX - rect.left; //x position within the element.
            const y = event.clientY - rect.top;  //y position within the element.
            return {
                x: x,
                y: y
            }
        }

        //does mouse position intersect element
        static intersects(node, event) {
        }

        static addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
            target.addEventListener(type, function fn(event) {
                target.removeEventListener(type, fn, removeOptions);
                listener.apply(this, arguments, addOptions);
            });
        }
    }

    let SvelteGanttExternal;

        function drag(node, data) {
            const { gantt } = data;    
            const windowElement = window;

            let successful = false;
            //TODO make these functions gantt instance specific
            const onmouseenter = (e) => {
                successful = true; 
            };
            const onmouseleave = (e) => {
                successful = false;
            };
            
            function onmousedown(event) {
                event.preventDefault();
                
                const element = data.elementContent();
                Object.assign(element.style, {
                    top: event.pageY+'px',
                    left: event.pageX+'px'
                });
                document.body.appendChild(element);
                data.element = element;
                data.dragging = true;

                const { rowContainerElement } = gantt.store.get();
                rowContainerElement.addEventListener('mouseenter', onmouseenter);
                rowContainerElement.addEventListener('mouseleave', onmouseleave);

                windowElement.addEventListener('mousemove', onmousemove, false);
                DOMUtils.addEventListenerOnce(windowElement, 'mouseup', onmouseup);
            }
            
            function onmousemove(event) {
                event.preventDefault();
                const { dragging, element } = data;
                if(dragging) {
                    Object.assign(element.style, {
                        top: event.pageY+'px',
                        left: event.pageX+'px'
                    });
                }
            }

            function onmouseup(event) {
                const { element, onsuccess, onfail, gantt } = data;
                const { rowContainerElement } = gantt.store.get();
                document.body.removeChild(element);
                data.dragging = false;
                data.element = null;

                //if over gantt
                if(successful){
                    //create task
                    const rowCenterX = rowContainerElement.getBoundingClientRect().left + rowContainerElement.getBoundingClientRect().width / 2;
                    
                    const mousePos = DOMUtils.getRelativePos(rowContainerElement, event);
                    const dropDate = gantt.utils.getDateByPosition(mousePos.x);

                    //TODO extract into helper, used in Task
                    let elements = document.elementsFromPoint(rowCenterX, event.clientY);
                    let rowElement = elements.find((element) => element.classList.contains('row'));
                    if(rowElement !== undefined) {
                        const { visibleRows } = gantt.store.get();
                        const targetRow = visibleRows.find((r) => r.rowElement === rowElement);
                        onsuccess(targetRow, dropDate, gantt);
                    }
                }
                else{
                    onfail();
                    //fail, return indicator to ex-div
                    //remove task if created
                }

                rowContainerElement.removeEventListener('mouseenter', onmouseenter);
                rowContainerElement.removeEventListener('mouseleave', onmouseleave);
                windowElement.removeEventListener('mousemove', onmousemove, false);
            }

            node.addEventListener('mousedown', onmousedown, false);

            return {
                update() {
                    
                },
                destroy() {
                    node.removeEventListener('mousedown', onmousedown, false);
                    //windowElement.removeEventListener('mousemove', onmousemove, false);
                    node.removeEventListener('mousemove', onmousemove, false);
                    node.removeEventListener('mouseup', onmouseup, false);
                }
            }
        }

        SvelteGanttExternal = {};

        SvelteGanttExternal.defaults = {
            // draggable elements
            elements: [],
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

        SvelteGanttExternal.create = function(element, options){
            const data = Object.assign({}, SvelteGanttExternal.defaults, options);

            drag(element, data);
            /*return new SvelteGanttExternal({
                target: element,
            });*/
        };

        var SvelteGanttExternal$1 = SvelteGanttExternal;

    return SvelteGanttExternal$1;

}());
//# sourceMappingURL=svelteGanttExternal.js.map
