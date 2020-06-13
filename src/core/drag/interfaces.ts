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