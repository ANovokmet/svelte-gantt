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
export declare class SvelteGanttExternal {
    draggable: Draggable;
    element: HTMLElement;
    options: DragOptions;
    constructor(node: HTMLElement, options: DragOptions);
    onDrag({ x, y }: {
        x: any;
        y: any;
    }): void;
    onDrop(event: any): void;
}
export {};
