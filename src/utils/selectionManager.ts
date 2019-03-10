import { Store } from 'svelte/store.js';

export default class {
    store: Store;

    constructor(store: Store) {
        this.store = store;
        this.store.set({selection: []});
    }

    selectSingle(item){
        this.store.set({selection: [item]});
    }

    toggleSelection(item){
        const { selection } = this.store.get();
        const index = selection.indexOf(item);
        if(index !== -1){
            selection.splice(index, 1);
        }
        else{
            selection.push(item);
        }
        this.store.set({selection});
    }

    clearSelection(){
        this.store.set({selection: []});
    }
}