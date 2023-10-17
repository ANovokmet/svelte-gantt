import { addEventListenerOnce } from '../utils/dom';
import type { EntityStore } from '../core/store';
import type { OffsetData, DraggableSettings } from '../core/drag';
import { Draggable } from '../core/drag';
import { writable } from 'svelte/store';
import { SvelteTask } from '../core/task';

export interface SelectedItem {
    HTMLElement: HTMLElement;
    offsetData: OffsetData;
    draggable: Draggable;
}

export class SelectionManager {
    // TODO:: figure out why these exist
    oldReflections = [];
    newTasksAndReflections = [];

    taskSettings = new Map<string, DraggableSettings>();
    currentSelection = new Map<string, SelectedItem>();
    selectedTasks = writable({});

    constructor(private taskStore: EntityStore<SvelteTask>) {}

    selectSingle(taskId, node) {
        if (!this.currentSelection.has(taskId)) {
            this.unSelectTasks();
            this.toggleSelection(taskId, node);
        }
        this.selectedTasks.set({ [taskId]: true });
    }

    toggleSelection(taskId, node) {
        this.currentSelection.set(taskId, {
            HTMLElement: node,
            offsetData: undefined,
            draggable: undefined
        });
        this.selectedTasks.update(selections => ({
            ...selections,
            [taskId]: !selections[taskId]
        }));
    }

    unSelectTasks() {
        this.selectedTasks.set({});
        this.currentSelection.clear();
    }

    dispatchSelectionEvent(taskId, event) {
        const taskSetting = this.taskSettings.get(taskId);
        const x = taskSetting.getX();
        const y = taskSetting.getY();
        const width = taskSetting.getWidth();

        for (const [selId, selectedItem] of this.currentSelection.entries()) {
            if (selId !== taskId) {
                const selectedSetting = this.taskSettings.get(selId);
                selectedItem.offsetData = {
                    offsetPos: {
                        x: selectedSetting.getX() - x,
                        y: selectedSetting.getY() - y
                    },
                    offsetWidth: selectedSetting.getWidth() - width
                };
            } else {
                selectedItem.offsetData = {
                    offsetPos: {
                        x: null,
                        y: null
                    },
                    offsetWidth: null
                };
            }
        }
        this.dragOrResizeTriggered(event);
    }

    dragOrResizeTriggered = event => {
        for (const [selId, selectedItem] of this.currentSelection.entries()) {
            const draggable = new Draggable(
                selectedItem.HTMLElement,
                this.taskSettings.get(selId),
                selectedItem.offsetData
            );
            draggable.onmousedown(event);
            this.currentSelection.set(selId, { ...selectedItem, draggable: draggable });
        }

        window.addEventListener('mousemove', this.selectionDragOrResizing, false);
        addEventListenerOnce(window, 'mouseup', this.selectionDropped);
    };

    selectionDragOrResizing = event => {
        for (const [, selectedItem] of this.currentSelection.entries()) {
            const { draggable } = selectedItem;
            draggable.onmousemove(event);
        }
    };

    selectionDropped = event => {
        window.removeEventListener('mousemove', this.selectionDragOrResizing, false);
        for (const [, selectedItem] of this.currentSelection.entries()) {
            const { draggable } = selectedItem;
            draggable.onmouseup(event);
        }

        if (this.oldReflections.length) this.taskStore.deleteAll(this.oldReflections);
        if (this.newTasksAndReflections.length)
            this.taskStore.upsertAll(this.newTasksAndReflections);

        this.newTasksAndReflections.splice(0);
        this.oldReflections.splice(0);
    };
}

// export let draggableTasks: object = {};
// export let currentSelection: Map<number,HTMLElement> = new Map();

// export class SelectionManager {

//     selectSingle(taskId, node) {
//         if (!currentSelection.has(taskId)) {
//             this.unSelectTasks()
//             currentSelection.set(taskId, node);
//         }
//     }

//     toggleSelection(taskId, node) {
//         currentSelection.set(taskId, node);
//     }

//     unSelectTasks() {
//         for (const [taskId, node] of currentSelection.entries()) {
//             currentSelection.delete(taskId);
//         }
//     }

//     dispatchTaskEvent(taskId, event) {
//         const x = draggableTasks[taskId].settings.getX();
//         const y = draggableTasks[taskId].settings.getY();
//         const width = draggableTasks[taskId].settings.getWidth();

//         draggableTasks[taskId].mouseStartPosX = getRelativePos(draggableTasks[taskId].settings.container, event).x - x;
//         draggableTasks[taskId].mouseStartPosY = getRelativePos(draggableTasks[taskId].settings.container, event).y - y;

//         if(draggableTasks[taskId].dragAllowed && draggableTasks[taskId].mouseStartPosX < draggableTasks[taskId].settings.resizeHandleWidth) {
//             draggableTasks[taskId].direction = 'left';
//             draggableTasks[taskId].resizing = true;
//         }

//         if(draggableTasks[taskId].dragAllowed && draggableTasks[taskId].mouseStartPosX > width - draggableTasks[taskId].settings.resizeHandleWidth) {
//             draggableTasks[taskId].direction = 'right';
//             draggableTasks[taskId].resizing = true;
//         }

//         draggableTasks[taskId].onmousedown(event);

//         for (const [selId, node] of currentSelection.entries()) {
//             if (selId !== taskId) {
//                 draggableTasks[selId].direction = draggableTasks[taskId].direction;
//                 draggableTasks[selId].resizing = draggableTasks[taskId].resizing; //prvent resizing and draggin at the same time

//                 draggableTasks[selId].offsetPos.x = (draggableTasks[selId].settings.getX() - x);
//                 draggableTasks[selId].offsetPos.y = (draggableTasks[selId].settings.getY() - y);
//                 draggableTasks[selId].offsetWidth =  draggableTasks[selId].settings.getWidth() - width

//                 const offsetMousePosition: offsetMousePostion = {
//                 clientX: event.clientX + draggableTasks[selId].offsetPos.x,
//                 clientY: event.clientY + draggableTasks[selId].offsetPos.y,
//                 isOffsetMouseEvent: true //fake left click on all items in selection
//                 }

//                 draggableTasks[selId].onmousedown(offsetMousePosition);
//             }
//         }
//     }
// }
