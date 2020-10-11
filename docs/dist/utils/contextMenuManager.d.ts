import { ContextMenu } from '../ui';
export declare class ContextMenuManager {
    current: ContextMenu;
    constructor();
    open(actions: any, position: any): ContextMenu;
    close(): void;
}
