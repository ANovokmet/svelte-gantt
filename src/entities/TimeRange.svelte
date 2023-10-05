<script lang="ts">
    import { normalizeClassAttr } from 'src/utils/dom';

    export let model;
    export let left;
    export let width;
    export let resizing = false;

    const _position = {
        width,
        x: left
    };
    $: {
        _position.x = left;
        _position.width = width;
    }

    let classes;
    $: {
        classes = normalizeClassAttr(model.classes);
    }
</script>

<div
    class="sg-time-range {classes}"
    class:moving={resizing}
    style="width:{_position.width}px;left:{_position.x}px"
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
            rgba(0, 0, 0, 0) 46%,
            #e03218 49%,
            #e03218 51%,
            rgba(0, 0, 0, 0) 55%
        );
        background-size: 6px 6px !important;
        color: red;
        font-weight: 400;
    }

    .sg-time-range-label {
        margin-top: 10px;
        background: #fff;
        white-space: nowrap;
        padding: 4px;
        font-weight: 400;
        font-size: 10px;
    }
</style>
