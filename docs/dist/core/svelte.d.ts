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
