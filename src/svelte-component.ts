declare module '*.html' {
	interface ComponentOptions {
		target?: HTMLElement;
		data?: any;
		store?: any;
	}

	interface Cancellable {
		cancel: () => void;
	}

	interface Component {
		new(options: ComponentOptions): any;

		destroy(detach?: boolean): void;
		get(): any;
		set(newState: any): any;
		fire(eventName: string, data: any): void;
		on(eventName: string, handler: (event: any) => void): Cancellable;
	}

	const component: Component;

	export default component;
}



