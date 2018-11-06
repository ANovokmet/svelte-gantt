import ContextMenu from './ContextMenu.html';

export default class {
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
        });

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