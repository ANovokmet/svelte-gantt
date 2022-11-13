import _svelteGanttTable from './Table.svelte';
import type { ComponentCreator, Component } from '../../core/svelte';

var SvelteGanttTable = _svelteGanttTable as unknown as ComponentCreator<Component>;

export { SvelteGanttTable };