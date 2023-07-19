declare module "*.svelte" {
    export { SvelteComponentDev as default } from 'svelte/internal';
    export class SelectionManager {
        selectSingle(taskId: any, node: any): void;
        toggleSelection(taskId: any, node: any): void;
        unSelectTasks(): void;
        dispatchTaskEvent(taskId: any, event: any): void;

        dragOrResizeTriggered: (event) => void;
        selectionDragOrResizing: (event) => void;
        selectionDropped: (event) => void;
    };
}