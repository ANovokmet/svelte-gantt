import type { EntityStore } from '../core/store';
import { writable } from 'svelte/store';
import type { SvelteTask } from '../core/task';

export class SelectionManager {
    // TODO:: figure out why these exist
    oldReflections = [];
    newTasksAndReflections = [];

    selectedTasks = writable<{ [taskId: string]: boolean; }>({});

    constructor(private taskStore: EntityStore<SvelteTask>) {}

    selectSingle(taskId) {
        this.unSelectTasks();
        this.selectedTasks.set({ [taskId]: true });
    }

    toggleSelection(taskId) {
        this.selectedTasks.update(selections => ({
            ...selections,
            [taskId]: !selections[taskId]
        }));
    }

    unSelectTasks() {
        this.selectedTasks.set({});
    }
}
