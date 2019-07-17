export class DOMUtils {
    isTaskVisible() {

    }
    
    isRowVisible() {

    }

    static isLeftClick(event) {
        return event.which === 1;
    }

    //get mouse position within the element
    static getRelativePos(node: HTMLElement, event: MouseEvent) {
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top;  //y position within the element.
        return {
            x: x,
            y: y
        }
    }

    //does mouse position intersect element
    static intersects(node, event) {
    }

    static addEventListenerOnce(target: HTMLElement|Window, type: string, listener, addOptions?, removeOptions?) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn, removeOptions);
            listener.apply(this, arguments, addOptions);
        });
    }
}