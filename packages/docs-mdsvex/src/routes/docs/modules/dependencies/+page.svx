


## Dependencies

Renders a dependency between two tasks. Used by SvelteGanttDependencies module:

-   `id` (`Number`|`String`) Unique id of dependency.
-   `fromId` (`Number`|`String`) Id of dependent task.
-   `toId` (`Number`|`String`) Id of dependency task.
-   `stroke` (`String`) Stroke color.
    -   eg. `'red'` or `'#ff0000'`
-   `strokeWidth` (`Number`) Width of stroke.
-   `arrowSize` (`Number`) Size of the arrow head.