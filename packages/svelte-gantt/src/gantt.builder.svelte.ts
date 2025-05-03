import { GanttBuilder, type GanttProps } from '@svelte-gantt/gantt-core';
import type { SvelteTask, TaskModel, RowModel, SvelteRow } from '@svelte-gantt/gantt-core';

export class SvelteGanttBuilder extends GanttBuilder {
  constructor(props: GanttProps) {
    super(props);
  }

  #rowStore = $derived.by(() => super.rowStore);
  #taskStore = $derived.by(() => super.taskStore);
  #timeRangeStore = $derived.by(() => super.timeRangeStore);
  #layout = $derived.by(() => super.getLayout());

  get rowStore() {
    return this.#rowStore;
  }

  get taskStore() {
    return this.#taskStore;
  }

  get timeRangeStore() {
    return this.#timeRangeStore;
  }

  getLayout() {
    return this.#layout;
  }
}