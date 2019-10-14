export interface PositionProvider {
    getPos(event?: MouseEvent): {posX: number, posY: number};
    getWidth(event?: MouseEvent): number;
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