<script lang="ts">
    import { getContext } from 'svelte';
    import type { SvelteTask } from '../task';
    import { onDestroy, type Snippet } from 'svelte';
    import { DraggableBuilder } from './draggable.builder.svelte';

    interface Props {
      task: SvelteTask;
      children?: Snippet<[{ state: any; onPointerDown(e: PointerEvent): void; }]>;
    }

    let { task, children }: Props = $props();

    const context = getContext('drag');

    const builder = new DraggableBuilder({
      get task() { return task; },
      context,
    });

    onDestroy(() => builder.destroy());
</script>

{@render children?.({ state: builder.state, onPointerDown: builder.onPointerDown })}
