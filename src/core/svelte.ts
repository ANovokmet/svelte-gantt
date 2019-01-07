export interface Component {
	set(data: {}): void;
	get(key?: string): any;
	on(key: string, handler: (event: any) => void): {
		cancel: () => void
	};
}