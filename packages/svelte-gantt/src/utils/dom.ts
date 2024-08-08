export function isLeftClick(event) {
    return event.which === 1;
}

/**
 * Gets mouse position within an element
 * @param node
 * @param event
 */
export function getRelativePos(node: HTMLElement, event: Pick<MouseEvent, 'clientX' | 'clientY'>) {
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top; //y position within the element.
    return {
        x: x,
        y: y
    };
}
export function getRelativePosition(node: HTMLElement, event: Pick<MouseEvent, 'clientX' | 'clientY'>) {
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top; //y position within the element.
    return [x, y] as const;
}

/**
 * Adds an event listener that triggers once.
 * @param target
 * @param type
 * @param listener
 * @param addOptions
 * @param removeOptions
 */
export function addEventListenerOnce(
    target: HTMLElement | Window,
    type: string,
    listener,
    addOptions?,
    removeOptions?
) {
    target.addEventListener(type, function fn() {
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

export function sortFn(prop: (element) => number | string) {
    return function (a, b) {
        if (prop(a) < prop(b)) {
            return -1;
        } else if (prop(a) > prop(b)) {
            return 1;
        }
        return 0;
    };
}

export function normalizeClassAttr(classes: Array<string> | string) {
    if (!classes) {
        return '';
    }
    if (typeof classes === 'string') {
        return classes;
    }
    if (Array.isArray(classes)) {
        return classes.join(' ');
    }
    return '';
}

/* eslint-disable */
export function debounce<F extends (...args) => void>(func: F, wait: number, immediate = false) {
    let timeout;
    return function () {
        const context = this,
            args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    } as F;
}

export function throttle<F extends (...args) => void>(func: F, limit: number): F {
    let wait = false;
    return function () {
        if (!wait) {
            func.apply(null, arguments);
            wait = true;
            setTimeout(function () {
                wait = false;
            }, limit);
        }
    } as F;
}

/** How much pixels near the bounds user has to drag to start scrolling */
const DRAGGING_TO_SCROLL_TRESHOLD = 40;
/** How much pixels does the view scroll when dragging */
const DRAGGING_TO_SCROLL_DELTA = 40;

function outOfBounds(event: MouseEvent, rect: DOMRect) {
    return {
        left: event.clientX - rect.left < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
        top: event.clientY - rect.top < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
        right: event.clientX - rect.left > rect.width - DRAGGING_TO_SCROLL_TRESHOLD,
        bottom: event.clientY - rect.top > rect.height - DRAGGING_TO_SCROLL_TRESHOLD
    };
}

export const scrollIfOutOfBounds = throttle((event: MouseEvent, scrollable: HTMLElement) => { // throttle elsewhere
    // throttle the following
    const mainContainerRect = scrollable.getBoundingClientRect();
    const bounds = outOfBounds(event, mainContainerRect);
    if (bounds.left || bounds.right) {
        // scroll left
        scrollable.scrollTo({
            left: scrollable.scrollLeft + (bounds.left ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
            behavior: 'smooth'
        });
    }

    if (bounds.top || bounds.bottom) {
        // scroll top
        scrollable.scrollTo({
            top: scrollable.scrollTop + (bounds.top ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
            behavior: 'smooth'
        });
    }
}, 250);

export function getRowAtPoint(event: MouseEvent) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    const rowElement = elements.find(element => !!element.getAttribute('data-row-id'));
    if (rowElement !== undefined) {
        const rowId = rowElement.getAttribute('data-row-id');
        return rowId;
    }
    return null;
}