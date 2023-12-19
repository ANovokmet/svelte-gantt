import type { ColumnService } from './column';

export interface TimeRangeModel {
    id: number; // | string;
    from: any; // date
    to: any; // date

    classes?: string | string[];
    label?: string;
    resizable?: boolean;
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
        model.resizable = model.resizable === undefined ? true : model.resizable;

        const left = this.columnService.getPositionByDate(model.from);
        const right = this.columnService.getPositionByDate(model.to);

        return {
            model,
            left: left,
            width: right - left,
            resizing: false
        };
    }
}
