import { ColumnService } from "./column";

export interface TimeRangeModel {
    id: number; // | string;
    from: any; // moment
    to: any; // moment

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

export class TimeRangeFactory {
    columnService: ColumnService;

    constructor(columnService: ColumnService) {
        this.columnService = columnService;
    }

    create(model: TimeRangeModel): SvelteTimeRange {
        // enable dragging
        model.enableResizing = model.enableResizing === undefined ? true : model.enableResizing;

        const left = this.columnService.getPositionByDate(model.from);
        const right = this.columnService.getPositionByDate(model.to); 

        return {
            model,
            left: left,
            width: right-left,
            resizing: false
        }
    }
}