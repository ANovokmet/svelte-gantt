<script>
    export let top;
    export let left;
    export let actions = [];
    export let onactionend = null;

    export function position(point) {
        (top = point.y), (left = point.x);
    }

    function execute(event, action) {
        event.stopPropagation();
        action.action();
        if (onactionend) onactionend();
    }
</script>

<div class="sg-context-menu" style="top:{top}px;left:{left}px">
    {#each actions as action}
        <div class="context-option" on:click={event => execute(event, action)}>{action.label}</div>
    {/each}
</div>

<style>
    .sg-context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        padding: 0.25em 0;
        font-size: 10px;
        transition: opacity 0.4s ease 0s;
        opacity: 1;
        box-shadow: rgba(0, 0, 0, 0.32) 1px 1px 3px 0px;
    }

    .context-option:hover {
        background: #eee;
    }

    .context-option {
        cursor: default;
        padding: 0.2em 1em;
    }
</style>
