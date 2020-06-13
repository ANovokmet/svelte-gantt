<script>
    import { beforeUpdate, onMount, getContext } from 'svelte';

    let milestoneElement;

    import { Draggable } from '../core/drag';
    import { rowStore, taskStore } from '../core/store';
    const { rowPadding } = getContext('options');
    const { selectionManager, api, rowContainer, dndManager, columnService} = getContext('services');

    export let left;
    export let top;
    export let model;
    export let height = 20;

    const selection = selectionManager.selection;

    let dragging = false;
    let x = null;
    let y = null;
    $: {
        if(!dragging){
            x = left, y = top;
        }
    }

    function drag(node) {
        const ondrop = ({ x, y, currWidth, event, dragging }) => {
            let rowChangeValid = true;
            //row switching
            if(dragging){
                const sourceRow = $rowStore.entities[model.resourceId];
                const targetRow = dndManager.getTarget('row', event);
                if(targetRow){
                    model.resourceId = targetRow.model.id;
                    api.tasks.raise.switchRow(this, targetRow, sourceRow);
                }
                else{
                    rowChangeValid = false;
                }
            }
            
            dragging = false;
            const task = $taskStore.entities[model.id];
            if(rowChangeValid) {
                const newFrom = utils.roundTo(columnService.getDateByPosition(x)); 
                const newLeft = columnService.getPositionByDate(newFrom);

                Object.assign(model, {
                    from: newFrom
                });
                
                $taskStore.update({
                    ...task,
                    left: newLeft,
                    top: rowPadding + $rowStore.entities[model.resourceId].y,
                    model
                });
            }
            else {
                // reset position
                $taskStore.update({
                    ...task
                });
            }
        }

        const draggable = new Draggable(node, {
            onDown: ({x, y}) => {
                //this.set({x, y});
            }, 
            onDrag: (pos) => {
                x = pos.x, y = pos.y, dragging = true;
            },
            dragAllowed: () => {
                return row.model.enableDragging && model.enableDragging;
            },
            resizeAllowed: false,
            onDrop: ondrop, 
            container: rowContainer, 
            getX: () => x,
            getY: () => y
        });

        return {
            destroy() { draggable.destroy(); }
        }
    }

    onMount(() => {
        x = left = columnService.getPositionByDate(model.from); 
        y = top = row.y + $rowPadding;; 
        height = row.height - 2 * $rowPadding;
    });

    export function select(event) {
        if(event.ctrlKey){
            selectionManager.toggleSelection(model.id);
        }
        else{
            selectionManager.selectSingle(model.id);
        }
        
        if(selected){
            api.tasks.raise.select(model);
        }
    }

    let selected = false;
    $: selected = $selection.indexOf(model.id) !== -1;

    let row;
    $: row = $rowStore.entities[model.resourceId];
</script>

<div bind:this={milestoneElement}
    class="sg-milestone {model.classes}" 
    style="transform: translate({x}px, {y}px);height:{height}px;width:{height}px"
    use:drag 
    on:click="{select}"
    class:selected="{selected}"
    class:moving="{dragging}">
    <div class="inside"></div>
        <!-- <span class="debug">x:{x|0} y:{y|0}, x:{left|0} y:{top|0}</span> -->
</div>

<style>
    .sg-milestone {
		position: absolute;     
        top: 0;
        bottom: 0;

        white-space: nowrap;
        /* overflow: hidden; */

        height: 20px;
        width: 20px;

        min-width: 40px;
        margin-left: -20px;
        display: flex;
        align-items: center;
        flex-direction: column;

        transition: background-color 0.2s, opacity 0.2s;
    }

    .sg-milestone .inside {
        position: relative;
    }

    .sg-milestone .inside:before {
        position: absolute;
        top: 0;
        left: 0;
        content: ' ';
        height: 28px;
        width: 28px;
        transform-origin: 0 0;
        transform: rotate(45deg); 
        /* //after -45 */
        background-color: #feac31;
        border-color: #feac31;
    }

    .sg-milestone:not(.moving) {
        transition: transform 0.2s, background-color 0.2s, width 0.2s;
    }

    .sg-milestone.moving{
        z-index: 1;
    }

    .sg-milestone.selected {
        outline: 2px solid rgba(3, 169, 244, 0.5);
        outline-offset: 3px;
        z-index: 1;
    }
</style>