export declare function isLeftClick(event: any): boolean;
/**
 * Gets mouse position within an element
 * @param node
 * @param event
 */
export declare function getRelativePos(node: HTMLElement, event: MouseEvent): {
    x: number;
    y: number;
};
/**
 * Adds an event listener that triggers once.
 * @param target
 * @param type
 * @param listener
 * @param addOptions
 * @param removeOptions
 */
export declare function addEventListenerOnce(target: HTMLElement | Window, type: string, listener: any, addOptions?: any, removeOptions?: any): void;
/**
 * Sets the cursor on an element. Globally by default.
 * @param cursor
 * @param node
 */
export declare function setCursor(cursor: string, node?: HTMLElement): void;
export declare function sortFn(prop: (element: any) => any): (a: any, b: any) => 1 | -1 | 0;
export declare function debounce(func: any, wait: any, immediate: any): () => void;
export declare function throttle(func: any, limit: any): () => void;
