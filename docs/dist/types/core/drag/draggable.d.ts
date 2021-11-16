export interface DraggableSettings {
    onDown?(event?: DownDropEvent): void;
    onResize?(event?: ResizeEvent): void;
    onDrag?(event?: DragEvent): void;
    onMouseUp?(): void;
    onDrop(event?: DownDropEvent): void;
    dragAllowed: (() => boolean) | boolean;
    resizeAllowed: (() => boolean) | boolean;
    container: any;
    resizeHandleWidth?: any;
    getX?: (event?: MouseEvent) => number;
    getY?: (event?: MouseEvent) => number;
    getWidth?: () => number;
}
export interface DownDropEvent {
    mouseEvent: MouseEvent;
    x: number;
    y: number;
    width: number;
    resizing: boolean;
    dragging: boolean;
}
export interface DragEvent {
    mouseEvent: MouseEvent;
    x: number;
    y: number;
}
export interface ResizeEvent {
    mouseEvent: MouseEvent;
    x: number;
    width: number;
}
/**
 * Applies dragging interaction to gantt elements
 */
export declare class Draggable {
    mouseStartPosX: number;
    mouseStartPosY: number;
    mouseStartRight: number;
    direction: 'left' | 'right';
    dragging: boolean;
    resizing: boolean;
    initialX: number;
    initialY: number;
    initialW: number;
    resizeTriggered: boolean;
    settings: DraggableSettings;
    node: HTMLElement;
    constructor(node: HTMLElement, settings: DraggableSettings);
    get dragAllowed(): boolean;
    get resizeAllowed(): boolean;
    onmousedown: (event: MouseEvent) => void;
    onmousemove: (event: MouseEvent) => void;
    onmouseup: (event: MouseEvent) => void;
    destroy(): void;
}
