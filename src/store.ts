import { Store } from 'svelte/store.js';

export class GanttStore<V> extends Store {

    ids: string[]
    entities: {[key:string]:V}

    constructor(){
        super({
            ids: [],
            entities: []
        },{immutable: true});

        this.compute('selectAll', ['ids', 'entities'], (ids: string[], entities: {[key:string]:V}) => {
            return ids.map(id => entities[id]);
        });
    }

    add(entity){
        const { ids, entities } = this.get();
        this.set({
            ids: [ ...ids, entity.id ],
            entities: {
                ...entities,
                [entity.id]: entity
            }
        });
    }

    update(entity){
        const { entities } = this.get();
        this.set({
            entities: {
                ...entities,
                [entity.id]: entity
            }
        });
    }

    remove(id){
        const { ids, entities } = this.get();
        const { [id]: entity, ...newEntities } = entities;
        this.set({
            ids: ids.filter(i => i === id),
            entities: newEntities
        });
    }
}