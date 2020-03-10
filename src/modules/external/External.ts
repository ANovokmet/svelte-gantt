import { getRelativePos } from "../../utils/domUtils";
import { Draggable } from "../../core/drag";
import { SvelteRow } from "../../core/row";
import { SvelteGanttComponent } from "../../gantt";

let SvelteGanttExternal;

interface DragOptions {
    gantt: SvelteGanttComponent;
    elementContent(): any;
    dragging: boolean;
    enabled: boolean;
    onsuccess(target: SvelteRow, date, gantt: SvelteGanttComponent): void;
    onfail(): void;
}

function drag(node, data: DragOptions) {
    const { gantt } = data;
    const { rowContainerElement } = gantt.store.get();

    let element = null;

    return new Draggable(node, {
        onDown: ({ x, y }) => {
        },
        onDrag: ({ x, y }) => {

            if(!element) {
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
    },
        {
            getPos: (event: MouseEvent) => {
                return {
                    x: event.pageX,
                    y: event.pageY
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
    return data;
}

export { SvelteGanttExternal };