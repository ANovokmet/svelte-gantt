// import { SvelteGanttTableComponent } from './modules/table';
// import { SvelteGanttComponent } from './gantt';

// export declare var SvelteGanttTable: SvelteGanttTableComponent;
// export declare var SvelteGantt: SvelteGanttComponent;

import _svelteGantt from './Gantt.html';

import { SvelteGanttComponent, defaults } from './gantt';
import { GanttStore } from './core/store';
import { ComponentCreator } from './core/svelte';
import { SvelteGanttTable } from './modules/table';
import { SvelteGanttDependencies } from './modules/dependencies';
import { SvelteGanttExternal } from './modules/external/External';

var SvelteGantt = _svelteGantt as any as ComponentCreator<SvelteGanttComponent>;

function create(target, data, options) {
    // bind gantt modules
    const ganttModules = {
        ganttBodyModules: [],
        ganttTableModules: [],
        defaults: {}
    };

    if (options.modules) {
        options.modules.forEach(module => {
            Object.assign(ganttModules.defaults, module.defaults);
            
            if (module.type === 'body') {
                ganttModules.ganttBodyModules.push(module);
            }

            if (module.type === 'table') {
                ganttModules.ganttTableModules.push(module);
            }
        });
    }

    // initialize gantt state
    const newData = {
        initialRows: data.rows,
        initialTasks: data.tasks,
        _ganttBodyModules: ganttModules.ganttBodyModules,
        _ganttTableModules: ganttModules.ganttTableModules
    };

    // initialize all the gantt options
    const store = new GanttStore(Object.assign(
        {
            scrollTop: 0,
            scrollLeft: 0
        },
        defaults,
        ganttModules.defaults,
        options
    ));

    return new SvelteGantt({
        target,
        data: newData,
        store
    });
};

export {
    SvelteGantt,
    SvelteGanttTable,
    SvelteGanttDependencies,
    create,
    SvelteGanttExternal
};