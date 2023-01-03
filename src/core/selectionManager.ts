
import { getRelativePos } from '../utils/domUtils';
import type { offsetMousePostion } from '../utils/domUtils';

export let draggableTasks: object = {};
export let currentSelection: Map<number,HTMLElement> = new Map();

export class SelectionManager {

    selectSingle(taskId, node) {
        if(node && node.getBoundingClientRect().x == 0 && node.getBoundingClientRect().width == 0){
            node = <HTMLElement> document.querySelector('[data-task-id="'+node.dataset.taskId+'"]')
        }

        if (!currentSelection.has(taskId)) {
            this.unSelectTasks()
            currentSelection.set(taskId, node);
        }
    }

    toggleSelection(taskId, node) {
        if(node && node.getBoundingClientRect().x == 0 && node.getBoundingClientRect().width == 0){
            node = <HTMLElement> document.querySelector('[data-task-id="'+node.dataset.taskId+'"]')
        }

        currentSelection.set(taskId, node);
    }

    unSelectTasks() {
        for (const [taskId, node] of currentSelection.entries()) {
            node.classList.remove('sg-task-selected');
            currentSelection.delete(taskId);
        }
    }

    dispatchTaskEvent(taskId, event) {
        console.log('draggableTasks',draggableTasks);
        console.log('taskId',taskId);
        const x = draggableTasks[taskId].settings.getX();
        const y = draggableTasks[taskId].settings.getY();
        const width = draggableTasks[taskId].settings.getWidth();

        // const rows_rect = document.querySelector('.sg-rows').getBoundingClientRect();
        // const click_left_position_inside_rows = event.clientX - rows_rect.x;        // Valeur de x par rapport à 0/0 sur les rows
        // const click_left_position_inside_task = click_left_position_inside_rows - x; // Valeur de x par rapport à 0/0 s ur la task
        // const click_top_position_inside_rows = event.clientY - rows_rect.y;         // Valeur de y par rapport à 0/0 sur les rows
        // const click_top_position_inside_task = click_top_position_inside_rows - y;  // Valeur de y par rapport à 0/0 s ur la task

        draggableTasks[taskId].mouseStartPosX = getRelativePos(document.querySelector('.sg-rows'), event).x - x;
        draggableTasks[taskId].mouseStartPosY = getRelativePos(document.querySelector('.sg-rows'), event).y - y;

        if(draggableTasks[taskId].dragAllowed && draggableTasks[taskId].mouseStartPosX < draggableTasks[taskId].settings.resizeHandleWidth) {
            draggableTasks[taskId].direction = 'left';
            draggableTasks[taskId].resizing = true;
        }

        if(draggableTasks[taskId].dragAllowed && draggableTasks[taskId].mouseStartPosX > width - draggableTasks[taskId].settings.resizeHandleWidth) {
            draggableTasks[taskId].direction = 'right';
            draggableTasks[taskId].resizing = true;
        }

        draggableTasks[taskId].onmousedown(event);

        for (const [selId, node] of currentSelection.entries()) {
            node.classList.add('sg-task-selected');
            if (selId !== taskId) {
                draggableTasks[selId].direction = draggableTasks[taskId].direction;
                draggableTasks[selId].resizing = draggableTasks[taskId].resizing; //prvent resizing and draggin at the same time
                
                draggableTasks[selId].offsetPos.x = (draggableTasks[selId].settings.getX() - x);
                draggableTasks[selId].offsetPos.y = (draggableTasks[selId].settings.getY() - y);
                draggableTasks[selId].offsetWidth =  draggableTasks[selId].settings.getWidth() - width 

                const offsetMousePosition: offsetMousePostion = {
                clientX: event.clientX + draggableTasks[selId].offsetPos.x, 
                clientY: event.clientY + draggableTasks[selId].offsetPos.y,
                isOffsetMouseEvent: true //fake left click on all items in selection
                } 

                draggableTasks[selId].onmousedown(offsetMousePosition);
            }
        }
    }
}