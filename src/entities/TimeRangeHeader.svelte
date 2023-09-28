<script lang="ts">
    import { beforeUpdate, getContext } from 'svelte';
    import type { GanttContext, GanttContextServices, GanttContextOptions } from '../gantt'
    import { Draggable } from '../core/drag';
    import type { GanttDataStore } from '../core/store';

    const { rowContainer } : GanttContext = getContext('gantt');
    const { api, utils, columnService } : GanttContextServices = getContext('services');
    const { resizeHandleWidth } : GanttContextOptions = getContext('options');
    const { timeRangeStore } = getContext('dataStore') as GanttDataStore;

    export let model;
    export let width;
    export let left;
    
    const _position = {
        width,
        x: left
    }
    $: {
        _position.x = left, _position.width = width;
    };

    function drag(node) {
        const ondrop = (event) => {
            const newFrom = utils.roundTo(columnService.getDateByPosition(event.x)); 
            const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
            const newLeft = columnService.getPositionByDate(newFrom);
            const newRight = columnService.getPositionByDate(newTo);
            
            Object.assign(model, {
                from: newFrom,
                to: newTo
            });

            update({
                left: newLeft,
                width: newRight - newLeft,
                model,
                resizing: false
            });

            window.removeEventListener('mousemove', onmousemove, false);
        };

        function update(state) {
            timeRangeStore.update(state);
            _position.x = state.left;
            _position.width = state.width;
        }

        const draggable = new Draggable(node, {
            onDown: (event) => {
                api.timeranges.raise.clicked({model});
                update({
                    left: event.x,
                    width: event.width,
                    model,
                    resizing: true
                });
            }, 
            onResize: (event) => {
                api.timeranges.raise.resized({model, left:event.x, width:event.width});
                update({
                    left: event.x,
                    width: event.width,
                    model,
                    resizing: true
                });
            },
            dragAllowed: false,
            resizeAllowed: true,
            onDrop: ondrop, 
            container: rowContainer, 
            resizeHandleWidth,
            getX: () => _position.x,
            getY: () => 0,
            getWidth: () => _position.width
        });

        return { destroy: () => draggable.destroy() };
    }

    function setClass(node){
        if(!model.classes) return;
        node.classList.add(model.classes);
    }
</script>

<div class="sg-time-range-control" style="width:{_position.width}px;left:{_position.x}px" use:setClass>
    <div class="sg-time-range-handle-left" use:drag></div>
    <div class="sg-time-range-handle-right" use:drag></div>
</div>
<style>
    .sg-time-range-control {
        position: absolute;
    }

    .sg-time-range-handle-left {
        position: absolute;
        left: 0;
    }

    .sg-time-range-handle-right {
        position: absolute;
        right: 0;
    }

    .sg-time-range-handle-left::before, .sg-time-range-handle-right::before {
        position: absolute;
        content: '';
        bottom: 4px;
        border-radius: 6px 6px 6px 0;
        border: 2px solid #b0b0b7;
        width: 9px;
        height: 9px;
        transform: translateX(-50%) rotate(-45deg);
        background-color: #fff;

        border-color: #e03218;
        cursor: ew-resize;
    }
</style>