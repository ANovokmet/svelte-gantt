<script lang="ts">
    export let left;
    export let width;
</script>

<div class="column" style="left:{left}px;width:{width}px"></div>

<style>
    .column {
        position: absolute;
        height: 100%;
        box-sizing: border-box;
    }

    .column {
        border-right: #efefef 1px solid;
    }
</style>
