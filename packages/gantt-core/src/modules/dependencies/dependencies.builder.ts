import type { GanttBuilder } from '../../gantt.builder';
import type { DependencyModel } from './dependency';
import { DependencyBuilder } from './dependency.builder';

export class DependenciesBuilder {

  constructor(
    private gantt: GanttBuilder
  ) {
  }

  get dependencies() {
    return this.gantt.options.dependencies;
  }

  get visibleDependencies() {
    const result: DependencyModel[] = [];
    for (let i = 0; i < this.dependencies.length; i++) {
      const dependency = this.dependencies[i];
      const map = this.gantt.taskStore.entities;

      const fromTask = map[dependency.fromId];
      const toTask = map[dependency.toId];
      if (fromTask && toTask && Math.min(fromTask.top, toTask.top) <= this.gantt.virtual.virtualOffset + this.gantt.viewport.visibleHeight && Math.max(fromTask.top, toTask.top) >= this.gantt.virtual.virtualOffset) {
        result.push(dependency);
      }
    }
    return result;
  }

  get visibleDependencyBuilders() {
    return this.visibleDependencies.map(model => new DependencyBuilder({ model }, this.gantt));
  }
}