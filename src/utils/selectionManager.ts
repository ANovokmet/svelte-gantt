import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export class SelectionManager {
    selection: Writable<any[]>;

    constructor() {
        this.selection = writable([]);
    }

    selectSingle(item) {
        this.selection.set([item]);
    }

    toggleSelection(item) {
        this.selection.update(items => {
            const index = items.indexOf(item);
            if (index !== -1) {
                items.splice(index, 1);
            }
            else {
                items.push(item);
            }
            return items;
        });
    }

    clearSelection() {
        this.selection.set([]);
    }
}