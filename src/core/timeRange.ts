import { SvelteRow } from "./row";
import { SvelteGantt } from "./gantt";
import { Component } from "./svelte";

export interface TimeRangeModel {
    id: number; // | string;
    from: any; // moment
    to: any; // moment

    classes?: string | string[];
    label?: string;
    enableDragging?: boolean;
}

export class SvelteTimeRange {
    gantt: SvelteGantt;
    model: TimeRangeModel;
    component: Component;
    handle: Component;
    row: SvelteRow;

    left: number;
    width: number;

    resizing: boolean;
    
    constructor(gantt: SvelteGantt, timeRange: TimeRangeModel){
        this.gantt = gantt;
        this.model = timeRange;
        this.updatePosition();
    }

    updatePosition(){
        const left = this.gantt.utils.getPositionByDate(this.model.from);
        const right = this.gantt.utils.getPositionByDate(this.model.to); 

        this.left = left;
        this.width = right - left;
    }

    updateDate(){
        const from = this.gantt.utils.getDateByPosition(this.left);
        const to = this.gantt.utils.getDateByPosition(this.left + this.width);
                   
        const roundedFrom = this.gantt.utils.roundTo(from);
        const roundedTo = this.gantt.utils.roundTo(to);

        if(!roundedFrom.isSame(roundedTo)){
            this.model.from = roundedFrom;
            this.model.to = roundedTo;
        }
    }

    overlaps(other) {
        return !(this.left + this.width <= other.left || this.left >= other.left + other.width);
    }

    updateView() {
        if(this.component) {
            this.component.set({timeRange: this});
        }
        if(this.handle) {
            this.handle.set({timeRange: this});
        }
    }
}
