export class SvelteRow {

    constructor(gantt, row){
        // defaults
        // id of task, every task needs to have a unique one
        //row.id = row.id || undefined;
        // css classes
        row.classes = row.classes || '';
        // html content of row
        row.contentHtml = row.contentHtml || undefined;
        // enable dragging of tasks to and from this row 
        row.enableDragging = row.enableDragging === undefined ? true : row.enableDragging;
        //
        row.height = row.height || 24;
        // translateY

        this.gantt = gantt;
        this.model = row;
        this.tasks = [];
        this.visibleTasks = [];
    }

    addTask(task) {
        this.tasks.push(task);

        if (this.model.tasks === undefined) {
            this.model.tasks = []
        }
        if (this.model.tasks.indexOf(task.model) === -1) {
            this.model.tasks.push(task.model)
        }
    }

    moveTask(task) {
        //const sourceRow = task.row;
        //sourceRow.removeTask(task);

        //task.row = this;
        task.model.resourceId = this.model.id;
        this.addTask(task);
    }

    
    removeTask(task) {
        const index = this.tasks.indexOf(task);
        if(index !== -1){
            this.tasks.splice(index, 1);
        }

        const modelIndex = this.model.tasks.indexOf(task.model);
        if(modelIndex !== -1){
            this.model.tasks.splice(modelIndex, 1);
        }
    }

    updateView() {
        if(this.component) {
            this.component.set({row: this});
        }
    }

    updateVisibleTasks() {
        const { from, to } = this.gantt.store.get();
        this.visibleTasks = this.tasks.filter(task => !(task.model.to < from || task.model.from > to));
    }
}
