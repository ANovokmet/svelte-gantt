export interface SvelteGanttDateAdapter {
    format(date: number, format: string): string;
}
export declare class MomentSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    moment: any;
    constructor(moment: any);
    format(date: number, format: string): string;
}
export declare class NoopSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    format(date: number, format: string): string;
}
export declare function startOf(date: number, unit: string): number;
export declare function getDuration(unit: string, offset?: number): number;
