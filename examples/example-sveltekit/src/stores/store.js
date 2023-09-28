import {writable} from 'svelte/store';


export const options = writable({});
export const showOptions = writable(false);

export const setView = writable('none');
export const moveView = writable('none');