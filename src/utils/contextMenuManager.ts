import { ContextMenu } from '../ui';

export class ContextMenuManager {
    current: ContextMenu;

    constructor() {
        this.current = null;
    }

    open(actions, position) {
        if(this.current) {
            this.current.$destroy();
        }
        
        const contextMenu = new ContextMenu({
            target: document.body,
            props: { 
                actions,
                left: position.x,
                top: position.y,
                onactionend: () => contextMenu.$destroy()
            }
        });

        this.current = contextMenu;
        return this.current;
    }

    close() {
        if(this.current) {
            this.current.$destroy();
            this.current = null;
        }
    }
}