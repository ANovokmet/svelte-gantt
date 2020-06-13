<script>
    import Arrow from './Arrow.svelte';

    import { taskStore } from '../../core/store';

    export let id;
    export let fromId;
    export let toId;

    let fromTask;
    $: fromTask = $taskStore.entities[fromId];

    let toTask;
    $: toTask = $taskStore.entities[toId];
</script>

<div class="sg-dependency" style="left:0;top:0" data-dependency-id="{id}">
    <Arrow startX={fromTask.left + fromTask.width} startY={fromTask.top + fromTask.height / 2} endX={toTask.left}
        endY={toTask.top + toTask.height / 2} />
</div>

<style>
    .sg-dependency {
        position: absolute;
        width: 100%;
        height: 100%;
    }
</style>