/**
 * Typings for Svelte components.
 * 
 * Store typings were taken from 'svelte' npm package. 
 */

export interface ComponentOptions {
	target?: HTMLElement;
	data?: any;
	store?: any;
}

interface Cancellable {
	cancel: () => void;
}

export interface Component {
	constructor(options: ComponentOptions);

	destroy(detach?: boolean): void;
	get(): any;
	set(newState: any): any;
	fire(eventName: string, data: any): void;
	on(eventName: string, handler: (event: any) => void): Cancellable;
}

export interface ComponentCreator<C extends Component> {
	new(params?: any): C;
}