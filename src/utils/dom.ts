export interface offsetMousePostion {
    clientX: number | null, clientY: number | null;
    isOffsetMouseEvent?: boolean;
}

export function isLeftClick(event) {
    return event.which === 1;
}

/**
 * Gets mouse position within an element
 * @param node 
 * @param event 
 */
export function getRelativePos(node: HTMLElement, event: MouseEvent | offsetMousePostion ) {
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top;  //y position within the element.
    return {
        x: x,
        y: y
    }
}

/**
 * Adds an event listener that triggers once.
 * @param target 
 * @param type 
 * @param listener 
 * @param addOptions 
 * @param removeOptions 
 */
export function addEventListenerOnce(target: HTMLElement | Window, type: string, listener, addOptions?, removeOptions?) {
    target.addEventListener(type, function fn(event) {
        target.removeEventListener(type, fn, removeOptions);
        listener.apply(this, arguments, addOptions);
    });
}

/**
 * Sets the cursor on an element. Globally by default.
 * @param cursor 
 * @param node 
 */
export function setCursor(cursor: string, node: HTMLElement = document.body) {
    node.style.cursor = cursor;
}

export function sortFn(prop: (element: any) => any) {
    return function (a, b) {
        if (prop(a) < prop(b)) {
            return -1;
        } else if (prop(a) > prop(b)) {
            return 1;
        }
        return 0;
    }
}

export function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

export function throttle(func, limit) {
    let wait = false;
    return function () {
        if (!wait) {

            func.apply(null, arguments);
            wait = true;
            setTimeout(function () {
                wait = false;
            }, limit);
        }
    }
}