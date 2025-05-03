<script lang="ts">
    import Dependency from './Dependency.svelte';
    import { useGantt } from '../../gantt';

    const gantt = useGantt();

    let { dependencies = [] } = $props();

    let visibleDependencies = $derived.by(() => {
        const result = [];
        for (let i = 0; i < dependencies.length; i++) {
            const dependency = dependencies[i];
            const map = gantt.taskStore.entities;

            const fromTask = map[dependency.fromId];
            const toTask = map[dependency.toId];
            if (fromTask && toTask && Math.min(fromTask.top, toTask.top) <= gantt.virtual.virtualOffset + gantt.visibleHeight && Math.max(fromTask.top, toTask.top) >= gantt.virtual.virtualOffset) {
                result.push(dependency);
            }
        }
    viewport.visibleHeightsult;
    });
</script>

<div class="dependency-container">
    {#each visibleDependencies as dependency (dependency.id)}
        <Dependency {...dependency} />
    {/each}
</div>

<style>
    .dependency-container {
        position: absolute;
        width: 100%;
        height: 100%;

        pointer-events: none;
        top: 0;
        float: left;
        overflow: hidden;
        z-index: 0;
    }
</style>
