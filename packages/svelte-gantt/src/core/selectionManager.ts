import type { EntityStore } from '../core/store';
import { writable } from 'svelte/store';
import type { SvelteTask } from '../core/task';

export class SelectionManager {
    _selectedTasks = writable<{ [taskId: PropertyKey]: boolean; }>({});

    constructor(private taskStore: EntityStore<SvelteTask>) {}

    selectSingle(taskId) {
        this.unSelectTasks();
        this._selectedTasks.set({ [taskId]: true });
    }

    toggleSelection(taskId) {
        this._selectedTasks.update(selections => ({
            ...selections,
            [taskId]: !selections[taskId]
        }));
    }

    unSelectTasks() {
        this._selectedTasks.set({});
    }
}
