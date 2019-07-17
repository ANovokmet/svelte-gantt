import { SvelteGantt } from "./gantt";

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
    gantt: SvelteGantt;

    constructor(gantt: SvelteGantt) {
        this.gantt = gantt;
    }

    create(model: TimeRangeModel): SvelteTimeRange {
        // enable dragging
        model.enableResizing = model.enableResizing === undefined ? true : model.enableResizing;

        const left = this.gantt.utils.getPositionByDate(model.from);
        const right = this.gantt.utils.getPositionByDate(model.to); 

        return {
            model,
            left: left,
            width: right-left,
            resizing: false
        }
    }
}