import { addEventListenerOnce, getRelativePos } from "src/utils/domUtils";
import { draggable } from "src/core/drag";
import { SvelteGantt } from "src/core/gantt";
import { SvelteRow } from "src/core/row";

let SvelteGanttExternal;

interface DragOptions {
    gantt: SvelteGantt;
    elementContent(): any;
    dragging: boolean;
    enabled: boolean;
    onsuccess(target: SvelteRow, date, gantt: SvelteGantt): void;
    onfail(): void;
}

function drag(node, data: DragOptions) {
    const { gantt } = data;
    const windowElement = window;


    const { rowContainerElement } = gantt.store.get();

    let element = null;

    return draggable(node, {
        onDown: ({ posX, posY }) => {
        },
        onDrag: ({ posX, posY }) => {

            if(!element) {
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
            console.log('SUCC')
            console.log(posX, posY)

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
    },
        {
            getPos: (event: MouseEvent) => {
                console.log(event.clientX, event.clientY)
                return {
                    posX: event.pageX,
                    posY: event.pageY
                };
            },
            getWidth: () => 0
        }
    );
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
}

SvelteGanttExternal.create = function (element: HTMLElement, options) {
    const data = Object.assign({}, SvelteGanttExternal.defaults, options);

    drag(element, data);
    /*return new SvelteGanttExternal({
        target: element,
    });*/
    return data;
}

export default SvelteGanttExternal;