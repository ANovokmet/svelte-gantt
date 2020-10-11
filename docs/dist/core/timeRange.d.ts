import { ColumnService } from "./column";
export interface TimeRangeModel {
    id: number;
    from: any;
    to: any;
    classes?: string | string[];
    label?: string;
    enableResizing?: boolean;
}
export interface SvelteTimeRange {
    model: TimeRangeModel;
    left: number;
    width: number;
    resizing: boolean;
}
export declare class TimeRangeFactory {
    columnService: ColumnService;
    constructor(columnService: ColumnService);
    create(model: TimeRangeModel): SvelteTimeRange;
}
