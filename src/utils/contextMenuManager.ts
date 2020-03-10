import { ContextMenu } from '../ui';
import { Component } from '../core/svelte';
import { GanttStore } from '../core/store';

interface ContextMenu extends Component {
    constructor(options: any);
    close(): void;
}

export class ContextMenuManager {
    current: ContextMenu;
    store: GanttStore;

    constructor(store) {
        this.current = null;
        this.store = store;
    }

    open(actions, position) {
        if(this.current) {
            this.current.close();
        }
        
        const contextMenu = new ContextMenu({
            target: document.body,//this.gantt.refs.ganttElement,//todo: fix, styles (font size, font face), positioning
            data: { 
                actions,
                left: position.x,
                top: position.y,
                onactionend: () => contextMenu.close()
            }
        }) as ContextMenu;

        this.current = contextMenu;
        return this.current;
    }

    close() {
        if(this.current) {
            this.current.close();
            this.current = null;
        }
    }
}