import { Store } from 'svelte/store.js';

export class GanttStore extends Store {

    constructor(data){
        super(Object.assign({
            taskIds: [],
            taskMap: {},
            rowIds: [],
            rowMap: {}
        }, data),{ 
            immutable: !true 
        });

        // this.compute('selectAll', ['ids', 'entities'], (ids: string[], entities: {[key:string]:V}) => {
        //     return ids.map(id => entities[id]);
        // });
    }

    addTask(task: any) {
        const { taskIds, taskMap } = this.get();
        const newState = add(task, {ids: taskIds, entities: taskMap});
        this.set({taskIds: newState.ids, taskMap: newState.entities});
    }

    addAllTask(tasks: any) {
        const newState = addAll(tasks);
        this.set({taskIds: newState.ids, taskMap: newState.entities});
    }

    addAllRow(rows: any) {
        const newState = addAll(rows);
        this.set({rowIds: newState.ids, rowMap: newState.entities});
    }

    addRow(row: any) {
        const { rowIds, rowMap } = this.get();
        const newState = add(row, {ids: rowIds, entities: rowMap});
        this.set({rowIds: newState.ids, rowMap: newState.entities});
    }

    updateTask(task: any) {
        const { taskMap } = this.get();
        this.set({taskMap: update(task, {entities: taskMap}).entities});
    }

    updateRow(row: any) {
        const { rowMap } = this.get();
        this.set({rowMap: update(row, {entities: rowMap})});
    }
}

interface EntityState {
    ids?: number[], 
    entities: any
}

function add(entity, state: EntityState) {
    return {
        ids: [ ...state.ids, entity.model.id ],
        entities: {
            ...state.entities,
            [entity.model.id]: entity
        }
    };
}

function addMany(entities, state: EntityState) {

    for(const entity of entities) {
        state.ids.push(entity.model.id);
        state.entities[entity.model.id] = entity;
    }

    return {
        ids: state.ids.map(i => i),
        entities: state.entities
    }
}
function addAll(entities) {
    const ids = [];
    const newEntities = {};

    for(const entity of entities) {
        ids.push(entity.model.id);
        newEntities[entity.model.id] = entity;
    }

    return {
        ids: ids,
        entities: newEntities
    }
}

function update(entity, state: EntityState){
    return {
        entities: {
            ...state.entities,
            [entity.model.id]: entity
        }
    };
}

// add(entity){
//     const { ids, entities } = this.get();
//     this.set({
//         ids: [ ...ids, entity.id ],
//         entities: {
//             ...entities,
//             [entity.id]: entity
//         }
//     });
// }

// addMany(entityArr){
//     const { entities } = this.get();
//     const newEntities = {
//         ...entities,
//         ...entityArr
//     }

//     this.set({
//         ids: Object.keys(newEntities),
//         entities: newEntities
//     });
// }

// update(entity){
//     const { entities } = this.get();
//     this.set({
//         entities: {
//             ...entities,
//             [entity.id]: entity
//         }
//     });
// }

// remove(id){
//     const { ids, entities } = this.get();
//     const { [id]: entity, ...newEntities } = entities;
//     this.set({
//         ids: ids.filter(i => i === id),
//         entities: newEntities
//     });
// }