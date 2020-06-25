import { getRelativePos } from "../../utils/domUtils";
import { Draggable } from "../../core/drag";
import { SvelteRow } from "../../core/row";
import { SvelteGanttComponent } from "../../gantt";
import { Moment } from "moment";

interface DragOptions {
    /** SvelteGantt this is binded to */
    gantt: SvelteGanttComponent;
    /** Creates a dragging indicator element */
    elementContent(): HTMLElement;
    /** Is currently being dragged */
    dragging: boolean;
    /** Is enabled */
    enabled: boolean;
    /** Success callback, when dragged over a row */
    onsuccess?(target: SvelteRow, date: Moment, gantt: SvelteGanttComponent): void;
    /** Fail callback, when dragged outside gantt */
    onfail?(): void;
}

const defaults = {
    enabled: true,
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
    }
}

export class SvelteGanttExternal {
    draggable: Draggable;
    element: HTMLElement;
    public options: DragOptions;

    constructor(node: HTMLElement, options: DragOptions) {
        this.options = Object.assign({}, defaults, options);
        this.draggable = new Draggable(node, {
            onDrag: this.onDrag.bind(this),
            dragAllowed: () => this.options.enabled,
            resizeAllowed: false,
            onDrop: this.onDrop.bind(this),
            container: document.body,
            getX: (event: MouseEvent) => event.pageX,
            getY: (event: MouseEvent) => event.pageY,
            getWidth: () => 0
        });
    }

    onDrag({ x, y }) {
        if(!this.element) {
            this.element = this.options.elementContent();
            document.body.appendChild(this.element);
            this.options.dragging = true;
        }

        this.element.style.top = y + 'px';
        this.element.style.left = x + 'px';
    }

    onDrop(event) {
        const gantt = this.options.gantt;
        const targetRow = gantt.dndManager.getTarget('row', event.mouseEvent);
        if (targetRow) {
            const mousePos = getRelativePos(gantt.getRowContainer(), event.mouseEvent);
            const date = gantt.utils.getDateByPosition(mousePos.x);

            this.options.onsuccess?.(targetRow, date, gantt);
        }
        else {
            this.options.onfail?.();
        }

        document.body.removeChild(this.element);
        this.options.dragging = false;
        this.element = null;
    }
}