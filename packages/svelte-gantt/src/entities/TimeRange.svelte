<script lang="ts">
    import { normalizeClassAttr } from '../utils/dom';

    export let model;
    export let left;
    export let width;
    export let resizing = false;

    $: classes = normalizeClassAttr(model.classes);
</script>

<div
    class="sg-time-range {classes}"
    class:moving={resizing}
    style="width:{width}px;left:{left}px"
>
    {#if model.label}
        <div class="sg-time-range-label">{model.label}</div>
    {/if}
</div>

<style>
    .sg-time-range {
        height: 100%;
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;

        background-image: linear-gradient(
            -45deg,
            transparent 46%,
            #e03218 49%,
            #e03218 51%,
            transparent 55%
        );
        background-size: 6px 6px !important;
        font-weight: 400;
    }

    .sg-time-range-label {
        margin-top: 10px;
        background: #fff;
        color: red;
        white-space: nowrap;
        padding: 4px;
        font-weight: 400;
        font-size: 10px;
    }
</style>
