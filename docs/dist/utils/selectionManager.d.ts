import { Writable } from 'svelte/store';
export declare class SelectionManager {
    selection: Writable<any[]>;
    constructor();
    selectSingle(item: any): void;
    toggleSelection(item: any): void;
    clearSelection(): void;
}
