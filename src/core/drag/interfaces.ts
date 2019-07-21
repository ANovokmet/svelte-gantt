export interface PositionProvider {
    getPos(): {posX: number, posY: number};
    getWidth(): number;
}

export interface DraggableSettings {
    onDown(state: any): void; 
    onResize?(state: any): void;
    onDrag?(state: any): void;
    onDrop(state: any): void; 
    dragAllowed: (() => boolean) | boolean;
    resizeAllowed: (() => boolean) | boolean;
    container: any; 
    resizeHandleWidth?: any;
}