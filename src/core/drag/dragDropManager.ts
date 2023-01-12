import type { SvelteRow } from '../row';
import { get } from 'svelte/store';
import type { EntityStore } from '../store';

export type DropHandler = (event: MouseEvent) => any;

export class DragDropManager
{
    handlerMap: {[key:string]: DropHandler} = {};

    constructor(rowStore: EntityStore<SvelteRow>) {
        this.register('row', (event) => {
            let elements = document.elementsFromPoint(event.clientX, event.clientY);
            let rowElement = elements.find((element) => !!element.getAttribute('data-row-id'));
            if(rowElement !== undefined) {
                const rowId = rowElement.getAttribute('data-row-id');
                const { entities } = get(rowStore);
                const targetRow = entities[rowId];

                if(targetRow.model.enableDragging){
                    return targetRow;
                }
            }
            return null;
        });
    }

    register(target: string, handler: DropHandler) {
        this.handlerMap[target] = handler;
    }

    getTarget(target: string, event: MouseEvent): SvelteRow {
        var handler = this.handlerMap[target];

        if(handler){
            return handler(event);
        }
    }
}