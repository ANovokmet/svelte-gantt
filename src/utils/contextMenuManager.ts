import { ContextMenu } from '../components';
import { SvelteGantt } from '../core/gantt';

interface ContextMenu {
    constructor(options: any);
    close(): void;
}

export default class {
    current: ContextMenu;
    gantt: SvelteGantt;

    constructor(gantt) {
        this.current = null;
        this.gantt = gantt;
    }

    open(actions, position) {
        if(this.current) {
            this.current.close();
        }
        
        const contextMenu = new ContextMenu({
            target: document.body,//this.gantt.refs.ganttElement,//todo: fix, styles (font size, font face), positioning
            data: { actions },
            position: position,
            onactionend: () => contextMenu.close()
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