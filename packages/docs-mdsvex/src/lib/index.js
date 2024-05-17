// place files you want to import through the `$lib` alias in this folder.
export {default as NavBar} from './components/NavBar.svelte';

// place files you want to import through the `$lib` alias in this folder.
import moment from 'moment';
import { SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';


export function time(input) {
    return moment(input, 'HH:mm');
}

export const defaultOptions = {
    dateAdapter: new MomentSvelteGanttDateAdapter(moment),
    rows: [],
    tasks: [],
    headers: [
        { unit: 'day', format: 'MMMM Do' }, 
        { unit: 'hour', format: 'H:mm' }
    ],
    fitWidth: true,
    minWidth: 400,
    from: time('06:00'),
    to: time('14:00'),

    tableHeaders: [
        { title: 'Label', property: 'label', width: 140, type: 'tree' }
    ],
    tableWidth: 180,
    ganttTableModules: [SvelteGanttTable],
};