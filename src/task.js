export class SvelteTask {

    constructor(gantt, task, row){
        // defaults
        // id of task, every task needs to have a unique one
        //task.id = task.id || undefined;
        // completion %, indicated on task
        task.amountDone = task.amountDone || 0;
        // css classes
        task.classes = task.classes || '';
        // datetime task starts on, currently moment-js object
        task.from = task.from || null;
        // datetime task ends on, currently moment-js object
        task.to = task.to || null;
        // label of task
        task.label = task.label || undefined;
        // html content of task, will override label
        task.html = task.html || undefined;

        this.gantt = gantt;
        this.model = task;
        this.row = row;
        this.dependencies = [];
        this.updatePosition();
    }

    notify() {
        if(this.dependencies){
            this.dependencies.forEach(dependency => {
                dependency.update();
            });
        }
    }

    updatePosition(){
        const left = this.gantt.utils.getPositionByDate(this.model.from);
        const right = this.gantt.utils.getPositionByDate(this.model.to); 

        this.left = left;
        this.width = right - left;
    }

    updateDate(){
        const from = this.gantt.utils.getDateByPosition(this.left);
        const to = this.gantt.utils.getDateByPosition(this.left + this.width);
                   
        const roundedFrom = this.gantt.utils.roundTo(from);
        const roundedTo = this.gantt.utils.roundTo(to);

        if(!roundedFrom.isSame(roundedTo)){
            this.model.from = roundedFrom;
            this.model.to = roundedTo;
        }
    }

    overlaps(other) {
        return !(this.left + this.width <= other.left || this.left >= other.left + other.width);
    }

    subscribe(dependency) {
        this.dependencies.push(dependency);
    }

    unsubscribe(dependency) {
        let result = [];
        for(let i = 0; i < this.dependencies.length; i++) {
            if(this.dependencies[i] === dependency) {
                result.push(dependency);
            }
        }

        for(let i = 0; i < result.length; i++) {
            let index = this.dependencies.indexOf(result[i]);
            this.dependencies.splice(index, 1);
        }
    }

    updateView() {
        if(this.component) {
            this.component.set({task: this});
        }
    }
}
