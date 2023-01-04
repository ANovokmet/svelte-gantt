    
    <script lang="ts">
        import { getContext } from "svelte";
        
        import { setCursor } from "../utils/domUtils";
        import { taskStore, rowStore } from '../core/store';
        import { Draggable } from "../core/drag";
        import { reflectTask } from "../core/task";
        import {draggableTasks} from "../core/selectionManager";
    
        export let model;
        export let height;
        export let left;
        export let top;
        export let width;
        export let reflected = false;
    
        let animating = true;
    
        let _dragging = false;
        let _resizing = false;
    
        let _position = {
            x: left,
            y: top,
            width: width,
        }
    
        $: updatePosition(left, top, width);
        function updatePosition(x, y, width) {
            if(!_dragging && !_resizing) {
                _position.x = x;
                _position.y = y;
                _position.width = width;
                // should NOT animate on resize/update of columns
            }
        }
        
        const { rowContainer } = getContext('gantt');
        const { taskContent, resizeHandleWidth, rowPadding, onTaskButtonClick, reflectOnParentRows, reflectOnChildRows, taskElementHook } = getContext('options');
        const { dndManager, api, utils, columnService } = getContext('services');
    
        function drag(node) {  
            const ondrop = (event) => {
                let rowChangeValid = true;
                //row switching
                const sourceRow = $rowStore.entities[model.resourceId];
                if (event.dragging) {
                    const targetRow = dndManager.getTarget("row", event.mouseEvent);
                    if (targetRow) {
                        model.resourceId = targetRow.model.id;
                        api.tasks.raise.switchRow(this, targetRow, sourceRow);
                    } else {
                        rowChangeValid = false;
                    }
                }
    
                _dragging = _resizing = false;
    
                const task = $taskStore.entities[model.id];
    
                if (rowChangeValid) {
                    const prevFrom = model.from;
                    const prevTo = model.to;
                    const newFrom = model.from = utils.roundTo(columnService.getDateByPosition(event.x));
                    const newTo = model.to = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
                    const newLeft = columnService.getPositionByDate(newFrom) | 0;
                    const newRight = columnService.getPositionByDate(newTo) | 0;
    
                    const targetRow = $rowStore.entities[model.resourceId];
                    const left = newLeft;
                    const width = newRight - newLeft;
                    const top = $rowPadding + targetRow.y;
                    
                    updatePosition(left, top, width);
    
                    const newTask = {
                        ...task,
                        left: left,
                        width: width,
                        top: top,
                        model
                    }
    
                    const changed = prevFrom != newFrom || prevTo != newTo || (sourceRow && sourceRow.model.id !== targetRow.model.id);
                    if(changed) {
                        api.tasks.raise.change({ task: newTask, sourceRow, targetRow });
                    }
                    
                    console.log('%cTASK SVELTE UPDATE', 'background:grey; color:white;')
                    taskStore.update(newTask);
    
                    if(changed) {
                        api.tasks.raise.changed({ task: newTask, sourceRow, targetRow });
                    }
    
                    // update shadow tasks
                    if(newTask.reflections) {
                        console.log('%cTASK SVELTE UPDATE', 'background:black; color:white;')
                        taskStore.deleteAll(newTask.reflections);
                    }
    
                    const reflectedTasks = [];
                    if(reflectOnChildRows && targetRow.allChildren) {
                        if(!newTask.reflections)
                            newTask.reflections = [];
    
                        const opts = { rowPadding: $rowPadding };
                        targetRow.allChildren.forEach(r => {
                            const reflectedTask = reflectTask(newTask, r, opts);
                            newTask.reflections.push(reflectedTask.model.id);
                            reflectedTasks.push(reflectedTask);
                        });
                    }
    
                    if(reflectOnParentRows && targetRow.allParents.length > 0) {
                        if(!newTask.reflections)
                            newTask.reflections = [];
    
                        const opts = { rowPadding: $rowPadding };
                        targetRow.allParents.forEach(r => {
                            const reflectedTask = reflectTask(newTask, r, opts);
                            newTask.reflections.push(reflectedTask.model.id);
                            reflectedTasks.push(reflectedTask);
                        });
                    }
    
                    if(reflectedTasks.length > 0) {
                        console.log('%cTASK SVELTE UPSERT ALL', 'background:purple; color:white;')
                        taskStore.upsertAll(reflectedTasks);
                    }
    
                    if(!(targetRow.allParents.length > 0) && !targetRow.allChildren) {
                        newTask.reflections = null;
                    }
                }
                else {
                    // reset position
                    (_position.x = task.left), (_position.width = task.width), (_position.y = task.top);
                }
            };

            const ondrag = (event) => {
                (_position.x = event.x), (_position.y = event.y), (_dragging = true);
                api.tasks.raise.move(model);
            };

            const onmouseup = () => {
                setCursor("default");
                api.tasks.raise.moveEnd(model);
            }
            
            if (!reflected) { // reflected tasks must not be resized or dragged
                draggableTasks[model.id] = new Draggable(node, {
                    onDown: (event) => {
                        console.log('EVENT ON DOWN DRAGGABLE TASK', event);
                        if (event.dragging) {
                            setCursor("move");
                        }
                        if (event.resizing) {
                            setCursor("e-resize");
                        }
                    },
                    // onMouseUp: () => {
                    //     setCursor("default");
                    // },
                    onMouseUp:onmouseup,
                    onResize: (event) => {
                        (_position.x = event.x), (_position.width = event.width), (_resizing = true);
                    },
                    // onDrag: (event) => {
                    //     (_position.x = event.x), (_position.y = event.y), (_dragging = true);
                    // },
                    onDrag:ondrag,
                    dragAllowed: () => {
                        return row.model.enableDragging && model.enableDragging;
                    },
                    resizeAllowed: () => {
                        return row.model.enableDragging && model.enableDragging;
                    },
                    onDrop: ondrop,
                    container: rowContainer,
                    resizeHandleWidth, 
                    getX: () => _position.x,
                    getY: () => _position.y,
                    getWidth: () => _position.width,
                })
                return {
                    destroy: () => {console.log('DESTROYING'); delete draggableTasks[model.id];}
                };
            }
        }
    
        function taskElement(node, model) {
            if(node && node.getBoundingClientRect().x == 0 && node.getBoundingClientRect().width == 0){
                node = <HTMLElement> document.querySelector('[data-task-id="'+node.dataset.taskId+'"]')
                console.log('NODE AFTER', node, node.getBoundingClientRect())
            }

            if(taskElementHook) {
                return taskElementHook(node, model);
            }
        }
    
        export function onclick(event) {
            if (onTaskButtonClick) {
                onTaskButtonClick(model);
            }
        }
    
        let row;
        $: row = $rowStore.entities[model.resourceId];
    </script>
    
    <style>
        .sg-label-bottom {
            position: absolute;
            top: calc(100% + 10px);
            color: #888;
        }
    
        .debug {
            position: absolute;
            top: -10px;
            right: 0;
            font-size: 8px;
            color: black;
        }
    
        .sg-task {
            position: absolute;
            border-radius: 2px;
    
            white-space: nowrap;
            /* overflow: hidden; */
    
            transition: background-color 0.2s, opacity 0.2s;
            pointer-events: all;
        }
    
        :global(.sg-task) {
            background: rgb(116, 191, 255);
        }
    
        .sg-task-background {
            position: absolute;
            height: 100%;
            top: 0;
        }
    
        .sg-task-content {
            position: absolute;
            height: 100%;
            top: 0;
    
            padding-left: 14px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }
    
        .sg-task:not(.moving) {
            transition: transform 0.2s, background-color 0.2s, width 0.2s;
        }
    
        .sg-task.moving {
            z-index: 10000;
            opacity: 0.5;
        }
    
        .sg-task.dragging-enabled:hover::before{
            content: "";
            width: 4px;
            height: 50%;
            top: 25%;
            position: absolute;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.5);
            cursor: ew-resize;
            margin-left: 3px;
            left: 0;
            border-width: 0 1px;
            z-index: 1;
        }
    
        .sg-task.dragging-enabled:hover::after{
            content: "";
            width: 4px;
            height: 50%;
            top: 25%;
            position: absolute;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.5);
            cursor: ew-resize;
            margin-right: 3px;
            right: 0;
            border-width: 0 1px;
            z-index: 1;
        }
    
        .sg-task-reflected {
            opacity: 0.5;
        }
    
        .sg-task-background {
            background: rgba(0, 0, 0, 0.2);
        }
    
        :global(.sg-task) {
            color: white;
            background: rgb(116, 191, 255);
        }
    
        :global(.sg-task:hover) {
            background: rgb(98, 161, 216);
        }
    
        :global(.sg-task.selected) {
            background: rgb(69, 112, 150);
        }
    </style>
    
    <div
      data-task-id="{model.id}"  
      on:dblclick={() => {api.tasks.raise.dblclicked(model)}} 
      use:drag
      use:taskElement={model}
      class="sg-task {model.classes}"
      style="width:{_position.width}px; height:{height}px; transform: translate({_position.x}px, {_position.y}px);" 
      class:moving={_dragging || _resizing}
      class:animating
      class:sg-task-reflected={reflected}
      class:dragging-enabled={row.model.enableDragging && model.enableDragging}
      >
      {#if model.amountDone}
      <div class="sg-task-background" style="width:{model.amountDone}%" />
      {/if}
      <div class="sg-task-content">
        {#if model.html}
          {@html model.html}
        {:else if taskContent}
          {@html taskContent(model)}
        {:else}{model.label}{/if}
        <!-- <span class="debug">x:{_position.x} y:{_position.y}, x:{left} y:{top}</span> -->
        {#if model.showButton}
          <span class="sg-task-button {model.buttonClasses}" on:click={onclick}>
            {@html model.buttonHtml}
          </span>
        {/if}
      </div>
    
      {#if model.labelBottom}
        <label class="sg-label-bottom">{model.labelBottom}</label>
      {/if}
    </div>
    