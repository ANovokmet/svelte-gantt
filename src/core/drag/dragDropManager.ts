import { SvelteRow } from '../row';
import { GanttStore } from '../store';

export type DropHandler = (event: MouseEvent) => any;

export class DragDropManager
{
    store: GanttStore;
    handlerMap: {[key:string]: DropHandler} = {};

    constructor(store) {
        this.store = store;
        
        this.register('row', (event) => {
            let elements = document.elementsFromPoint(event.clientX, event.clientY);
            let rowElement = elements.find((element) => !!element.getAttribute('data-row-id'));
            if(rowElement !== undefined) {
                const rowId = parseInt(rowElement.getAttribute('data-row-id'));
                const { rowMap } = this.store.get();
                const targetRow = rowMap[rowId];

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
        //const rowCenterX = this.root.refs.mainContainer.getBoundingClientRect().left + this.root.refs.mainContainer.getBoundingClientRect().width / 2;
        var handler = this.handlerMap[target];
        if(handler){
            return handler(event);
        }
    }
}