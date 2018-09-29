export class DOMUtils {
    isTaskVisible() {

    }
    
    isRowVisible() {

    }

    //get mouse position within the element
    static getRelativePos(node, event) {
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top;  //y position within the element.
        return {
            x: x,
            y: y
        }
    }

    static addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
        target.addEventListener(type, function fn(event) {
            target.removeEventListener(type, fn, removeOptions);
            listener.apply(this, arguments, addOptions);
        });
    }
}