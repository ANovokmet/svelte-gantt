import ContextMenu from './ContextMenu.html';

export default class {
    constructor() {
        this.current = null;
    }

    open(actions, position) {
        if(this.current) {
            this.current.close();
        }
        
        const contextMenu = new ContextMenu({
            target: document.body,
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