import type { ComponentProps } from 'svelte';
import { asClassComponent } from 'svelte/legacy';

import SvelteGantt_ from './Gantt.svelte';
import { SvelteGanttTable } from './modules/table';
import { SvelteGanttDependencies } from './modules/dependencies';
import { SvelteGanttExternal } from './modules/external/external';
import { MomentSvelteGanttDateAdapter } from './utils/momentDateAdapter';

const SvelteGantt = asClassComponent(SvelteGantt_);

type SvelteGanttComponent = typeof SvelteGantt;

type SvelteGanttOptions = ComponentProps<typeof SvelteGantt_>;

export {
    SvelteGantt,
    SvelteGanttTable,
    SvelteGanttDependencies,
    SvelteGanttExternal,
    MomentSvelteGanttDateAdapter
};

export type { SvelteGanttComponent, SvelteGanttOptions };
