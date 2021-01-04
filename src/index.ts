// import { SvelteGanttTableComponent } from './modules/table';
// import { SvelteGanttComponent } from './gantt';

// export declare var SvelteGanttTable: SvelteGanttTableComponent;
// export declare var SvelteGantt: SvelteGanttComponent;

import _svelteGantt from './Gantt.svelte';

import { SvelteGanttComponent, SvelteGanttOptions } from './gantt';
import { ComponentCreator } from './core/svelte';
import { SvelteGanttTable } from './modules/table';
import { SvelteGanttDependencies } from './modules/dependencies';
import { SvelteGanttExternal } from './modules/external/external';

var SvelteGantt = _svelteGantt as unknown as ComponentCreator<SvelteGanttComponent, SvelteGanttOptions>;

export {
    SvelteGantt,
    SvelteGanttTable,
    SvelteGanttDependencies,
    SvelteGanttExternal
};