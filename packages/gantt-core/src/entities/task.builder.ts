import type { TaskModel } from '../core/task';
import { normalizeClassAttr } from '../utils/dom';
import { isResizable } from '../utils/utils';
import { memo } from '../utils/getters';
import type { GanttBuilder } from '../gantt.builder';

type Props = {
  model: TaskModel;
  height: number;
  left: number;
  top: number;
  width: number;

  reflected: boolean;
  animating: boolean;
  selected: boolean;

  onPointerDown: ((e: PointerEvent) => void);
}

export class TaskBuilder {
  get model() { return this.props.model; }
  get height() { return this.props.height; }
  get left() { return this.props.left; }
  get top() { return this.props.top; }
  get width() { return this.props.width; }

  get reflected() { return this.props.reflected; }
  get animating() { return this.props.animating; }
  get selected() { return this.props.selected; }

  get classes() {
    return this.#classes();
  }

  get style() {
    return this.#style();
  }

  constructor(
    private props: Props,
    private gantt: GanttBuilder,
  ) {
    this.props = props;
  }

  #classes = memo(() => [this.model.classes], classes => classes ? normalizeClassAttr(this.model.classes) : 'sg-task-default');

  #resizeEnabled = () => {
    const row = this.gantt.rowStore.entities[this.model.resourceId];
    return this.model.type !== 'milestone' && row && isResizable(row.model) && isResizable(this.model);
  }

  #style = () => ({
    width: `${this.width}px`,
    height: `${this.height}px`,
    left: `${this.left}px`,
    top: `${this.top}px`,
  });

  get attrs() {
    return {
      'data-task-id': this.model.id,
      // style: this.style,
      // style: {
      //   width: `${this.width}px`,
      //   height: `${this.height}px`,
      //   left: `${this.left}px`,
      //   top: `${this.top}px`,
      // },
      class: this.classes,
      'data-sg-task': '',
      'data-sg-milestone': this.model.type === 'milestone',
      'data-animating': this.animating,
      'data-sg-task-reflected': this.reflected,
      'data-sg-task-selected': this.selected,
      'data-resize-enabled': this.#resizeEnabled(),
      'data-sg-task--sticky': this.model.stickyLabel,
      'data-sg-task-instant': this.width === 0,
      onpointerdown: (e: PointerEvent) => this.props.onPointerDown(e),
    };
  }
}
