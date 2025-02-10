import type { ComponentProps } from 'svelte';

import SvelteGantt from './Gantt.svelte';
import { SvelteGanttTable } from './modules/table';
import { SvelteGanttDependencies } from './modules/dependencies';
import { SvelteGanttExternal } from './modules/external/external';
import { MomentSvelteGanttDateAdapter } from './utils/momentDateAdapter';

export {
    SvelteGantt,
    SvelteGanttTable,
    SvelteGanttDependencies,
    SvelteGanttExternal,
    MomentSvelteGanttDateAdapter
};

type SvelteGanttComponent = SvelteGantt;

type SvelteGanttOptions = ComponentProps<SvelteGantt>;

export type { SvelteGanttComponent, SvelteGanttOptions };
