/**
 * Typings for Svelte components.
 *
 * Store typings were taken from 'svelte' npm package.
 */
export interface ComponentOptions<T> {
    target: Element;
    anchor?: Element;
    props?: T;
    hydrate?: boolean;
    intro?: boolean;
}
export interface Component<T = Record<string, any>> {
    constructor(options: ComponentOptions<T>): any;
    $set(props?: T): void;
    $on<T = any>(event: string, callback: (event: CustomEvent<T>) => void): () => void;
    $destroy(): void;
}
export interface ComponentCreator<C extends Component<T>, T = Record<string, any>> {
    new (options: ComponentOptions<T>): C;
}
/**
 * Avoid installing svelte in projects
 */
declare module "svelte/store" {
    interface Writable<T> extends Readable<T> {
        /**
         * Set value and inform subscribers.
         * @param value to set
         */
        set(value: T): void;
        /**
         * Update value using callback and inform subscribers.
         * @param updater callback
         */
        update(updater: (state: T) => T): void;
    }
    interface Readable<T> {
        /**
         * Subscribe on value changes.
         * @param run subscription callback
         * @param invalidate cleanup callback
         */
        subscribe(run: (value: T) => void, invalidate?: (value?: T) => void): () => void;
    }
}
