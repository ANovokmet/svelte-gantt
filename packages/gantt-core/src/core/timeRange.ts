import type { GanttBuilder } from 'src/gantt.builder';
import { isResizable } from '../utils/utils';

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
  readonly resizable: boolean;
}

export class TimeRangeFactory {
  constructor(
    private gantt: GanttBuilder
  ) {
  }

  create(model: TimeRangeModel): SvelteTimeRange {
    // enable dragging

    const left = this.gantt.columnService.getPositionByDate(model.from);
    const right = this.gantt.columnService.getPositionByDate(model.to);

    return {
      model,
      left: left,
      width: right - left,
      resizing: false,
      get resizable() {
        return isResizable(model);
      }
    };
  }
}
