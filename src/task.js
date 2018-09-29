export default class SvelteTask {
    
    constructor(task, ganttUtils){
        this.ganttUtils = ganttUtils;
        Object.assign(this, task);
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
        const left = this.ganttUtils.getPositionByDate(this.from);
        const right = this.ganttUtils.getPositionByDate(this.to); 

        this.left = left;
        this.width = right - left;
    }

    updateDate(){
        const from = this.ganttUtils.getDateByPosition(this.left);
        const to = this.ganttUtils.getDateByPosition(this.left + this.width);
                   
        this.from = this.ganttUtils.roundTo(from);
        this.to = this.ganttUtils.roundTo(to);
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
}
