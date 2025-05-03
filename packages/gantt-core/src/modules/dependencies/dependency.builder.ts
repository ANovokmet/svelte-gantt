import { type GanttBuilder } from '../../gantt.builder';
import { drawPath, type DependencyModel } from './dependency';

type Props = {
  model: DependencyModel;
}

export class DependencyBuilder {
  constructor(
    private props: Props,
    private gantt: GanttBuilder,
  ) {
  }

  get model() {
    return this.props.model;
  }

  get fromTask() {
    return this.gantt.taskStore.entities[this.model.fromId];
  }

  get isFromRowHidden() {
    return !this.gantt.rowStore.entities[this.fromTask.model.resourceId].expanded;
  }

  get toTask() {
    return this.gantt.taskStore.entities[this.model.toId];
  }

  get isToRowHidden() {
    return !this.gantt.rowStore.entities[this.toTask.model.resourceId].expanded;
  }

  get geometry() {
    return drawPath(this.fromTask, this.toTask, this.isFromRowHidden, this.isToRowHidden);
  }

  get visible() {
    return (!this.isFromRowHidden && !this.isToRowHidden) || this.isFromRowHidden !== this.isToRowHidden;
  }
}
