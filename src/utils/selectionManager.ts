export default class {
    selection: any[];

    constructor() {
        this.selection = [];
    }

    selectSingle(item){
        this.selection.forEach((selectionItem) => { 
            this.updateSelected(selectionItem, false);
        });
        this.updateSelected(item, true);
        this.selection = [item];
    }

    toggleSelection(item){
        const index = this.selection.indexOf(item);
        if(index !== -1){
            this.updateSelected(item, false);
            this.selection.splice(index, 1);
        }
        else{
            this.updateSelected(item, true);
            this.selection.push(item);
        }
    }

    updateSelected(item, value){
        if(item.selected !== value){
            item.selected = value;
            item.updateView();
        }
    }

    clearSelection(){
        this.selection = [];
    }
}