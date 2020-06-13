<script>
    import { onMount } from 'svelte';

    // [svelte-upgrade suggestion]
    // manually refactor all references to __this
    const __this = {};

    export let contextMenu;

    export let top = 0;
    export let left = 0;
    export let actions = [];
    export let onactionend = null;

    onMount(() => {
            position(__this.options.position);
            //this.set({ actions: this.options.actions });
        });

    // [svelte-upgrade suggestion]
    // review these functions and remove unnecessary 'export' keywords
    export function position(point) {
            top = point.y, left = point.x;
        }

    export function execute(event, action) {
            event.stopPropagation();
            action.action();
            onactionend && onactionend();
            //close();
        }

    export function close() {
            //this.refs.yolo.remove();
            __this.destroy();
        }

    export function isTarget(event) {
            return contextMenu === event.target;
        }
</script>

<div class="context-menu" style="top:{top}px;left:{left}px" bind:this={contextMenu}>
    {#each actions as action}
        <div class="context-option" on:click="{event => execute(event, action)}">{action.label}</div>
    {/each}
</div>

<style>
    .context-menu {
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