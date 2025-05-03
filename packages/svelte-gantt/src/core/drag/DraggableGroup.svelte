<script lang="ts">
    import { setContext } from 'svelte';
    import type { DragChange, Position } from './types';
    import { DraggableGroupBuilder, type RootState } from './draggable-group.builder.svelte';
    import { createDraggableGroupBuilder, type DropEvent } from './draggable.svelte';
    import { getContext } from 'svelte';
    import type { SvelteTask } from '../task';
    import type { SvelteRow } from '../row';
    import { getRowAtPoint } from '../../utils/dom';
    import { isDraggable } from '../../utils/utils';
    import { useGantt } from '../gantt';

    interface Props {
      items?: { [taskId: PropertyKey]: RootState; };
      children?: import('svelte').Snippet<[any]>;
      onChange: (event: {  changes: DragChange[]; }) => void; 
      onItemsChange: (event: { items: { [taskId: PropertyKey]: RootState; }; }) => void;
    }

    let { 
      items = {},
      children,
      onChange = () => undefined,
      onItemsChange = () => undefined
    }: Props = $props();

    const builder = new DraggableGroupBuilder({
      items, // unused,
      onChange,
      onItemsChange,
    });

    $effect(() => {
      builder.root = {...items};
    });

    setContext('drag', builder);


    const { rowContainer, mainContainer, taskStore, rowStore, utils, columnService } = useGantt();
    const options = getContext('options');

    const drag = createDraggableGroupBuilder({
      get container() { return rowContainer; },
      onDrop(event) {
        const task = taskStore.entities[event.id];
        if (task) {
          const change = onDropSingle({
            ...event,
            x: event.x,
            y: event.y,
            width: event.width,
          } as DropEvent, task);
          onChange({ changes: [change] });
        }
      },
    });



  function onDropSingle(event: DropEvent, task: SvelteTask) {
    //row switching
    const { row, model } = task;
    const sourceRow = row;
    let targetRow: SvelteRow;
    if (event.dragging) {
      const rowId = getRowAtPoint(event.event);
      const row = rowStore.entities[rowId];
      if (row && isDraggable(row.model)) {
        targetRow = row;
      }
      // target row can be null
    } else {
      // dont know about this
      targetRow = row;
    }

    const newFrom = utils.roundTo(columnService.getDateByPosition(event.x));
    const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
    const newLeft = columnService.getPositionByDate(newFrom) | 0;
    const newRight = columnService.getPositionByDate(newTo) | 0;

    const left = newLeft;
    const width = newRight - newLeft;
    const top = options.rowPadding + (targetRow?.y ?? 0);
    // get value of top from the layout

    const current: Position = {
      left,
      top,
      width,
      from: newFrom,
      to: newTo,
    }
    const previous: Position = {
      left: task.left,
      width: task.width,
      top: task.top,
      from: model.from,
      to: model.to,
    }

    return {
      valid: true,
      task,
      current,
      previous,
      dragging: event.dragging,
      resizing: event.resizing,
      sourceRow,
      targetRow,
    };
  }
</script>

{@render children?.({ context: builder })}
