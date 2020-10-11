import { SvelteGanttComponent } from './gantt';
import { ComponentCreator } from './core/svelte';
import { SvelteGanttTable } from './modules/table';
import { SvelteGanttDependencies } from './modules/dependencies';
import { SvelteGanttExternal } from './modules/external/external';
declare var SvelteGantt: ComponentCreator<SvelteGanttComponent, Record<string, any>>;
export { SvelteGantt, SvelteGanttTable, SvelteGanttDependencies, SvelteGanttExternal };
