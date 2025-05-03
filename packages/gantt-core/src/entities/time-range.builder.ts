import { normalizeClassAttr } from '../utils/dom';
// import { useDraggable } from '../core/drag';
import { isResizable } from '../utils/utils';
import type { SvelteTimeRange } from '../core/timeRange';
import type { GanttBuilder } from '../gantt.builder';

type Props = {
  timeRange: SvelteTimeRange;
}

export class TimeRangeBuilder {

  _position = ({ // $state
    width,
    x: left
  });
  resizing = (false); // $state

  get timeRange() { return this.props.timeRange; }

  constructor(
    private props: Props,
    private gantt: GanttBuilder,
  ) {
    this.props = props;
  }

  classes = $derived(normalizeClassAttr(this.timeRange.model.classes));

  get attrs() {
    return {
      'sg-time-range': '',
      classes: this.classes,
      moving: this.resizing,
      style: `width:${this.timeRange.width}px; left:${this.timeRange.left}px`,
    };
  }

  get controlAttrs() {
    return {
      'sg-time-range-control': '',
      classes: this.classes,
      style: `width:${this._position.width}px; left:${this._position.x}px`,
      'sg-time-range-disabled': !isResizable(this.timeRange.model),
    }
  }

}
