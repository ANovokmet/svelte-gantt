import type { GanttBuilder } from '@svelte-gantt/gantt-core';
import { getContext, setContext } from 'svelte';

const GANTT_CONTEXT_KEY = Symbol('gantt');

export function createGantt(builder: GanttBuilder) {
  return setContext(GANTT_CONTEXT_KEY, builder);
}

export function useGantt(): GanttBuilder {
  return getContext(GANTT_CONTEXT_KEY);
}
