<script>
    import { getContext } from 'svelte';
    
    import Column from './Column.svelte';
    /**
     * Container component for columns rendered as gantt body background
     */
    export let columns = [];
</script>

<div class="sg-columns">
	{#each columns as column}
	<Column left={column.left} width={column.width} />
	{/each}
</div>
<style>
    .sg-columns {
      position: absolute;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
</style>