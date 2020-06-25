import _svelteGanttTable from './Table.svelte';
import { ComponentCreator, Component } from '../../core/svelte';

var SvelteGanttTable = _svelteGanttTable as unknown as ComponentCreator<Component>;

export { SvelteGanttTable };