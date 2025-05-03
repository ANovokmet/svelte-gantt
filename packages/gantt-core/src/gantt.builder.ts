import { ColumnService, getColumnsV2 } from './core/column';
import { createDelegatedEventDispatcher } from './core/events';
import { PackLayout } from './core/layout';
import { RowFactory, type RowModel } from './core/row';
import { Selection, type SelectionState } from './core/selection';
import { reflectTask as _, TaskFactory, type SvelteTask, type TaskModel } from './core/task';
import type { Header } from './gantt';
import { getAllPeriods, getExactDuration as getDuration, toValue } from './utils/date';
import { isLeftClick, whenEnterPress } from './utils/dom';
import { extract, memo, wrapExtract, type WithoutGetters } from './utils/getters';
import { getPositionByDate } from './utils/utils';
import { Virtualizer } from './virtualizer';
import { ResizeFeature } from './resize-observer';
import { TimeRangeFactory, type SvelteTimeRange, type TimeRangeModel } from './core/timeRange';
import type { TableBuilder } from './modules/table/table.builder';
import { RowBuilder } from './entities/row.builder';
import { defaults, type GanttState, type ViewportState, type GanttProps, type SvelteHeader, type SvelteHeaderCell } from './gantt.props';

export class GanttBuilder {
  id = generateId();
  idAttr = `sg-gantt-${this.id}`;

  get viewport(): ViewportState {
    // TODO:: not sure if this state should ever be passed as it really only depends on the window dimensions
    // also these values rarely change
    return extract(this.options.viewport, {
      visibleHeight: 0,
      visibleWidth: 0,
      offsetHeight: 0,
      offsetWidth: 0,
    });
  }

  onViewportChange(e: ViewportState) {
    this.options.onViewportChange(e);
  }

  table: TableBuilder | undefined;
  setTable(builder: TableBuilder) {
    this.table = builder;
  }

  get width() {
    return this.options.fitWidth && this.viewport.visibleWidth > this.options.minWidth ? this.viewport.visibleWidth : this.options.minWidth;
  }

  get bottomScrollbarVisible() {
    return this.viewport.offsetHeight - this.viewport.visibleHeight;
  }

  get rightScrollbarVisible() {
    return this.viewport.offsetWidth - this.viewport.visibleWidth;
  }

  // these deps change rarely, only by user action or resize 
  #columns = memo(() => [
    toValue(this.options.from),
    toValue(this.options.to),
    this.options.columnUnit,
    this.options.columnOffset,
    this.width,
  ], (from, to, unit, offset, width) => getColumnsV2(from, to, unit, offset, width));

  get columns() {
    return this.#columns();
  }

  get state() {
    return extract(this.options.ganttState, {
      expanded: {} as Record<PropertyKey, boolean>,
      hoveredRow: null as PropertyKey | null,
      selectedRow: null as PropertyKey | null,
      selection: {} as SelectionState,
    });
  }

  onStateChange(e: Partial<GanttState>) {
    this.options.onGanttStateChange({ ...this.state, ...e });
  }

  selection = new Selection({
    state: () => this.state.selection,
    onStateChange: e => this.onStateChange({ selection: e }),
  });

  #dispatcher = createDelegatedEventDispatcher();

  virtual: Virtualizer;
  columnService = new ColumnService(this);

  get originalRows() {
    return extract(this.options.rows, []);
  }

  get originalTasks() {
    return extract(this.options.tasks, []);
  }

  get originalTimeRanges() {
    return extract(this.options.timeRanges, []);
  }

  onRowsChange(e: RowModel[], changed: RowModel) {
    this.options.onRowsChange(e, changed);
  }

  onTasksChange(e: TaskModel[], changed: TaskModel) {
    this.options.onTasksChange(e, changed);
  }

  onTimeRangesChange(e: TimeRangeModel[], changed: TimeRangeModel) {
    this.options.onTimeRangesChange(e, changed);
  }

  rowFactory = new RowFactory(this);
  taskFactory = new TaskFactory(this);
  timeRangeFactory = new TimeRangeFactory(this);

  // immediate deps: rows
  createRowStore() {
    const state = this.rowFactory.createRows(this.originalRows);
    return {
      all: state.rows,
      entities: state.rowsById,
      update: (id: number, data: Partial<RowModel>) => {
        const item = this.originalRows.find(i => i.id === id);
        if (item) {
          Object.assign(item, data);
          this.onRowsChange([...this.originalRows], item);
        }
      }
    }
  }

  // immediate deps: tasks, columnService
  createTaskStore() {
    const all: SvelteTask[] = [];
    const entities: { [id: PropertyKey]: SvelteTask } = {};
    const rowTaskCache: { [id: PropertyKey]: PropertyKey[]; } = {};
    for (const taskModel of this.originalTasks) {
      const task = this.taskFactory.createTask(taskModel);
      all.push(task);
      entities[task.model.id] = task;
      if (!rowTaskCache[task.model.resourceId]) {
        rowTaskCache[task.model.resourceId] = [];
      }
      rowTaskCache[task.model.resourceId].push(task.model.id);
    }

    return {
      all,
      entities,
      rowTaskCache,
      update: (id: number, data: Partial<TaskModel>) => {
        const item = this.originalTasks.find(i => i.id === id);
        if (item) {
          Object.assign(item, data);
          this.onTasksChange([...this.originalTasks], item);
        }
      }
    };
  }

  // immediate deps: timeranges, columnService
  createRangeStore() {
    const all: SvelteTimeRange[] = [];
    const entities: { [id: PropertyKey]: SvelteTimeRange } = {};

    for (const model of this.originalTimeRanges) {
      const tr = this.timeRangeFactory.create(model);
      all.push(tr);
      entities[tr.model.id] = tr;
    }

    return {
      all,
      entities,
      update: (id: number, data: Partial<TimeRangeModel>) => {
        const item = this.originalTimeRanges.find(i => i.id === id);
        if (item) {
          Object.assign(item, data);
          this.onTimeRangesChange([...this.originalTimeRanges], item);
        }
      }
    };
  }

  get rowStore() {
    return this.createRowStore();
  }

  get taskStore() {
    return this.createTaskStore();
  }

  get timeRangeStore() {
    return this.createRangeStore();
  }

  layoutService = new PackLayout(this, true);

  // deps: rows, tasks, columnService
  getLayout() {
    return this.layoutService.position();
  }

  get visibleRowBuilders() {
    return this.virtual.virtualRows.map(row => new RowBuilder({ row }, this));
  }

  // computed
  get magnetDuration() {
    return this.options.magnetUnit && this.options.magnetOffset && getDuration(this.options.magnetUnit as any, this.options.magnetOffset as any);
  }

  options: WithoutGetters<Required<GanttProps>>;

  constructor(
    private props: GanttProps
  ) {
    this.options = wrapExtract(props, defaults) as WithoutGetters<Required<GanttProps>>;
    this.#dispatcher.onDelegatedEvent('click', 'data-task-id', (event, data, target) => {
      const taskId = data;
      if (isLeftClick(event) && !target.classList.contains('sg-task-reflected') && !target.classList.contains('sg-ignore-click')) {
        if (event.ctrlKey) {
          this.selection.toggle(taskId);
        } else {
          this.selection.select(taskId);
        }
      }
    });

    this.#dispatcher.onDelegatedEvent('dblclick', 'data-task-id', (_event, _data) => {
      // const taskId = data;
      // api['tasks'].raise.dblclicked(taskStore.entities[taskId], event);
    });

    this.#dispatcher.onDelegatedEvent('pointerover', 'data-row-id', (event, data) => {
      this.onStateChange({ hoveredRow: data });
    });

    this.#dispatcher.onDelegatedEvent('click', 'data-row-id', (event, data) => {
      this.selection.clear();
      if (this.state.selectedRow == data) {
        this.onStateChange({ hoveredRow: null });
      } else {
        this.onStateChange({ hoveredRow: data });
      }
    });

    this.#dispatcher.onDelegatedEvent('pointerleave', 'empty', () => {
      this.onStateChange({ hoveredRow: null });
    });

    const scrollTop = () => this.scrollTop;
    const visibleHeight = () => this.viewport.visibleHeight;
    const rows = () => this.rowStore.all;

    this.virtual = new Virtualizer({
      get scrollTop() { return scrollTop(); },
      get rows() { return rows(); },
      get visibleHeight() { return visibleHeight(); },
    });

    findElement('data-sg-timeline-body', (e) => {
      this.observeResize(e);
    });
  }

  destroy() {
    this.#dispatcher.offDelegatedEvent('click', 'data-task-id');
    this.#dispatcher.offDelegatedEvent('click', 'data-row-id');
    this.#dispatcher.offDelegatedEvent('dblclick', 'data-task-id');
  }

  elements = {
    root: {
      attrs: {
        class: {
          'sg-gantt': true,
          // [classes]: true,
          // 'sg-disable-transition': disableTransition,
        }
      },
      events: {
        onpointerdown: (e: PointerEvent) => { e.stopPropagation(); this.#dispatcher.onEvent(e); },
        onclick: (e: MouseEvent) => { e.stopPropagation(); this.#dispatcher.onEvent(e); },
        ondblclick: (e: MouseEvent) => this.#dispatcher.onEvent(e),
        onpointerover: (e: PointerEvent) => this.#dispatcher.onEvent(e),
        onpointerleave: (e: PointerEvent) => this.#dispatcher.onEvent(e),
      }
    },
    header: {
      attrs: {
        class: {
          'sg-header': true
        },
        style: {
          'padding-right': `${this.rightScrollbarVisible}px;`
        }
      }
      //     <div class="sg-header-scroller" use:horizontalScrollListener>
      //         <div class="header-container" style="width:{$_width}px">
      //             <ColumnHeader
      //                 {headers}
      //                 ganttBodyColumns={columns}
      //                 ganttBodyUnit={columnUnit}
      //                 onDateSelected={onDateSelected}
      //             />
      //             {#each $allTimeRanges as timeRange (timeRange.model.id)}
      //                 <TimeRangeHeader {...timeRange} />
      //             {/each}
      //         </div>
      //     </div>
    },
    body: {
      //     bind:this={mainContainer}
      //     use:dragCreateTasks={{ container: rowContainer, enabled: enableCreateTask, onMove: onCreateTaskMove, onEnd: onCreateTaskEnd, boundsContainer: mainContainer }}
      attrs: {
        class: {
          'sg-timeline-body': true,
          // zooming: zooming,
        }
      },
      // get columnsConfig() {
      //   return {
      //     columns,
      //     columnStrokeColor,
      //     columnStrokeWidth,
      //     useCanvasColumns,
      //   }
      // },
      // get getRowsContainerHeight() {
      //   return rowContainerHeight;
      // },
      // get getRowsContentPaddingTop() {
      //   return paddingTop;
      // },
      // get visibleRows() {
      //   return visibleRows;
      // },
      // get allTimeRanges() {
      //   return $allTimeRanges;
      // },
      // get visibleTasks() {
      //   return visibleTasks;
      // },
      events: {
        onscroll: (e: Event) => this.onBodyScroll(e),
        // onwheel: onwheel,
      }
      //    
      //         <div
      //             class="sg-rows"
      //             bind:this={rowContainer}
      //             style="height:{rowContainerHeight}px;"
      //         >
      //             <div style="transform: translateY({paddingTop}px);">
      //                 {#each visibleRows as row (row.model.id)}
      //                     <Row {row} />
      //                 {/each}
      //             </div>
      //         </div>

      //         <div class="sg-foreground">
      //             {#each $allTimeRanges as timeRange (timeRange.model.id)}
      //                 <TimeRange {...timeRange} />
      //             {/each}

      //             <DraggableGroup items={draggingTasks} onChange={onChange} onItemsChange={onItemsChange}>
      //                 {#each visibleTasks as task (task.model.id)}
      //                     <Draggable {task}>
      //                         {#snippet children({ state, onPointerDown })}
      //                             <Task
      //                                 {...task}
      //                                 model={task.model}
      //                                 left={state.x}
      //                                 top={state.y}
      //                                 width={state.width}
      //                                 height={task.height}
      //                                 dragging={state.dragging}
      //                                 resizing={state.resizing}
      //                                 onPointerDown={onPointerDown}
      //                             />
      //                         {/snippet}
      //                     </Draggable>
      //                 {/each}
      //             </DraggableGroup>
      //         </div>
    }
  }

  scrollTop = 0;
  scrollLeft = 0;

  private scrollTimeout: number | null = null;

  onBodyScroll(event: Event) {
    if (this.scrollTimeout) {
      return;
    }

    this.scrollTimeout = requestAnimationFrame(() => {
      const { scrollTop, scrollLeft } = event.target as HTMLElement;

      // TODO:: can be improved
      const scrollListeners = document.querySelectorAll(`#${this.idAttr} [data-sg-scroll-listener]`);
      for (const element of scrollListeners) {
        const orientation = element.getAttribute('data-sg-scroll-listener');
        if (orientation === 'horizontal') {
          element.scrollLeft = scrollLeft;
        } else {
          element.scrollTop = scrollTop;
        }
      }

      this.scrollTop = scrollTop;
      this.scrollLeft = scrollLeft;
      this.scrollTimeout = null;
    });
  }

  #columnHeaders = memo(() => [this.options.headers, this.options.from, this.options.to], () => {
    const result: SvelteHeader[] = [];
    for (const header of this.options.headers) {
      result.push({
        header,
        cells: this.produceColumns(header)
      });
    }
    return result;
  });

  get columnHeaders() {
    return this.#columnHeaders();
  }

  produceColumns(header: Header): SvelteHeaderCell[] {
    const { from, to, dateAdapter } = this.options;
    if (header.unit === this.options.columnUnit) {
      return this.columns.map(column => {
        const onSelect = () => this.props.onHeaderSelect?.(col);
        const col = {
          ...column,
          label: dateAdapter.format(column.from, header.format),
          // TODO:: delegate
          events: {
            onclick: onSelect,
            onkeydown: whenEnterPress(onSelect)
          },
        };
        return col;
      });
    }

    let distance_point = 0;
    let left = 0;
    const periods = getAllPeriods(from.valueOf(), to.valueOf(), header.unit as any, header.offset);
    return periods.map(period => {
      left = distance_point;
      distance_point = getPositionByDate(period.to, from.valueOf(), to.valueOf(), this.width);

      const onSelect = () => this.props.onHeaderSelect?.(col);

      const col =  {
        width: Math.min(distance_point - left, this.width),
        label: dateAdapter.format(period.from, header.format),
        from: period.from,
        to: period.to,
        left: left,
        // TODO:: delegate
        events: {
          onclick: onSelect,
          onkeydown: whenEnterPress(onSelect)
        },
      }

      return col;
    });
  }

  // TODO:: rethink this feature
  // _reflectedTasksCache = $derived.by(() => {
  //   const result: { [rowId: PropertyKey]: SvelteTask[] } = {};
  //   for (const task of this.taskStore.all) {
  //     const row = this.rowStore.entities[task.model.resourceId];
  //     if (!row) {
  //       continue;
  //     }

  //     if (this.options.reflectOnChildRows && row.allChildren) {
  //       for (const r of row.allChildren) {
  //         const reflectedTask = reflectTask(task, r, null as any);
  //         if (!result[r.model.id]) {
  //           result[r.model.id] = [];
  //         }
  //         result[r.model.id].push(reflectedTask);
  //       }
  //     }

  //     if (this.options.reflectOnParentRows && row.allParents) {
  //       for (const r of row.allParents) {
  //         const reflectedTask = reflectTask(task, r, null as any);
  //         if (!result[r.model.id]) {
  //           result[r.model.id] = [];
  //         }
  //         result[r.model.id].push(reflectedTask);
  //       }
  //     }
  //   }
  //   return result;
  // });

  orderedMap = useOrderedMap<SvelteTask>(task => task.model.id);

  #visibleTasks = memo(() => [this.virtual.virtualRows, this.taskStore.entities], () => this.orderedMap(this.taskToBeRendered()));

  // virtual.virtualRows
  // taskStore.rowTaskCache
  // taskStore.entities
  // visibleTasks = $derived.by(() => this.orderedMap(this.taskToBeRendered()));

  get visibleTasks() {
    return this.#visibleTasks();
  }

  *taskToBeRendered() {
    for (const row of this.virtual.virtualRows) {
      if (this.taskStore.rowTaskCache[row.model.id]) {
        for (const id of this.taskStore.rowTaskCache[row.model.id]) {
          yield this.taskStore.entities[id];
        }
      }

      // if (this._reflectedTasksCache[row.model.id]) {
      //   for (const task of this._reflectedTasksCache[row.model.id]) {
      //     yield task;
      //   }
      // }
    }

    // render all tasks being dragged if not already
    // for (const id in draggingTasks) {
    //   yield this.taskStore.entities[id];
    // }
  }

  resize = new ResizeFeature();

  observeResize(element: HTMLElement) {
    return this.resize.observe(element, () => {
      this.viewport.visibleHeight = element.clientHeight;
      this.viewport.visibleWidth = element.clientWidth;
      this.viewport.offsetHeight = element.offsetHeight;
      this.viewport.offsetWidth = element.offsetWidth;
    });
  }

  scrollToRow(id: PropertyKey, scrollBehavior: ScrollBehavior = 'auto') {
    const container = document.querySelector(`[data-sg-gantt="${this.id}"] [data-sg-timeline-body]`);
    if (!container) {
      throw Error('Scrolling container not found');
    }
    const { scrollTop, clientHeight } = container;
    const row = this.rowStore.entities[id];
    if (!row) {
      return;
    }
    const targetTop = row.y;

    if (targetTop < scrollTop) {
      container.scrollTo({
        top: targetTop,
        behavior: scrollBehavior
      });
    }

    if (targetTop > scrollTop + clientHeight) {
      container.scrollTo({
        top: targetTop + row.height - clientHeight,
        behavior: scrollBehavior
      });
    }
  }

  scrollToTask(id: PropertyKey, scrollBehavior: ScrollBehavior = 'auto') {
    const container = document.querySelector(`[data-sg-gantt="${this.id}"] [data-sg-timeline-body]`);
    if (!container) {
      throw Error('Scrolling container not found');
    }
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;

    const task = this.taskStore.entities[id];
    if (!task) {
      return;
    }
    const row = this.rowStore.entities[task.model.resourceId];
    if (!row) {
      return;
    }
    const targetLeft = task.left;
    const targetTop = row.y;

    const options: ScrollToOptions = {
      top: undefined,
      left: undefined,
      behavior: scrollBehavior
    };

    if (targetLeft < scrollLeft) {
      options.left = targetLeft;
    }

    if (targetLeft > scrollLeft + clientWidth) {
      options.left = targetLeft + task.width - clientWidth;
    }

    if (targetTop < scrollTop) {
      options.top = targetTop;
    }

    if (targetTop > scrollTop + clientHeight) {
      options.top = targetTop + row.height - clientHeight;
    }

    container.scrollTo(options);
  }
}

export function generateId(prefix = '') {
  const id = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}-${id}` : id;
}

function findElement(dataAttributeName: string, callback: (e: HTMLElement) => void, parentNode: Element = document.body) {
  const selector = `[${dataAttributeName}]`; // `[${dataAttributeName}="${id}"]`;
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    // this.elementCache.set(id, element);
    callback(element);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === dataAttributeName) {
        const element = mutation.target as HTMLElement;
        if (element.hasAttribute(dataAttributeName)) {
          callback(element);
          observer.disconnect();
          return;
        }
      }

      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute(dataAttributeName)) {
              callback(node);
              observer.disconnect();
              return;
            }

            const matches = node.querySelectorAll(selector);
            if (matches.length > 0) {
              callback(matches[0] as HTMLElement);
              observer.disconnect();
              return;
            }
          }
        }
      }
    }
  });

  observer.observe(parentNode, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [dataAttributeName]
  });
}

/**
 * Svelte detaches html elements when their order changes (even when keyed)
 * So to help CSS transitions between renders, the order of the items should
 * try to be preserved.
 *
 * @param getId 
 * @returns 
 */
export function useOrderedMap<T>(getId: (item: T) => PropertyKey) {
  let previousOrder: { [id: PropertyKey]: number; } = {};
  function map(items: Iterable<T>) {
    const unordered: T[] = [];
    const ordered: T[] = [];
    const order: { [id: PropertyKey]: number; } = {};
    const rendered: { [id: PropertyKey]: boolean } = {};
    let isOrdered = true;
    let ordinal = 0;
    function restorePosition(item: T) {
      if (!item) {
        return;
      }
      const id = getId(item);
      if (rendered[id]) {
        return;
      }
      rendered[id] = true;
      unordered.push(item);
      if (previousOrder[id] != null) {
        ordered[previousOrder[id]] = item;
      } else {
        isOrdered = false;
      }
      order[id] = ordinal++;
    }

    for (const item of items) {
      restorePosition(item);
    }

    if (ordered.length !== unordered.length) {
      isOrdered = false;
    }

    previousOrder = isOrdered ? previousOrder : order;
    const result = isOrdered ? ordered : unordered;

    return result;
  }

  return map;
}
