
Pass options object as `props` to the SvelteGantt constructor. 

```js
const gantt = new SvelteGantt({ 
    target: document.getElementById('example-gantt'), 
    props: { 
        // ...
    }
});
```


To update use `$set`, eg.

```js
gantt.$set({
    // ...
});
```

| Name | Description | Type | Default |
| - | - | - | -: |
| `rows` | `Array` | Rows to load in the gantt, see below. | undefined |
| `tasks` | `Array` | Tasks that display in the gantt, see below. | undefined |
| `timeRanges` | `Array` | Timeranges that display in the gantt, see below. | undefined |
| `dependencies` | `Array` | Dependencies that display in the gantt, used with the SvelteGanttDependencies module, see below. | undefined |
| `from` | `Moment` | Datetime timeline starts on. | undefined |
| `to` | `Moment` | Datetime timeline ends on. | undefined |
| `minWidth` | `Number` | Minimum width of gantt area in px. | undefined |
| `fitWidth` | `Boolean` | Should timeline stretch width to fit. | undefined |
| `highlightedDurations` | `Object` | Pattern for highlighting durations, see below. | undefined |
| `highlightColor` | `String` | Highlight color (for use with `highlightedDurations`). | undefined |
| `magnetUnit` | `String` | Minimum unit of time task date values will round to. | undefined |
| `magnetOffset` | `Number` | Amount of units task date values will round to. | undefined |
| `columnUnit` | `String` | Duration unit of columns. | undefined |
| `columnOffset` | `Number` | Duration width of column. | undefined |
|   | | eg. `columnUnit: 'minute', columnOffset: 15` will create a column for every 15 minutes. | undefined |
| `headers` | `Array` | List of headers used for main gantt area. | undefined |
| `dateAdapter` | `Object` | [Date adapter](#dateadapter) | undefined |
| `zoomLevels` | `Array` | List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll. | undefined |
| `rowHeight` | `Number` | Height of a single row in px. | undefined |
| `rowPadding` | `Number` | Padding of a single row in px. | undefined |
| `ganttTableModules` | `Array` | Modules used in gantt table area. eg. `[SvelteGanttTable]` | undefined |
| `ganttBodyModules` | `Array` | Modules used in gantt body area. eg. `[SvelteGanttDependencies]` | undefined |
| `reflectOnParentRows` | `Boolean` | When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree. | undefined |
| `reflectOnChildRows` | `Boolean` | When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree. | undefined |
| `classes` | `String`\|`Array` | Custom CSS classes to apply to gantt. | undefined |
| `resizeHandleWidth` | `Number` | Width of handle for resizing tasks, in px. | undefined |
| `onTaskButtonClick` | `Function` | Callback for task button clicks. | undefined |
| |   | eg. `(task) => console.log('clicked on: ', task)` |
| `taskContent` | `Function` | ,task content factory function. | undefined |
| |   | eg. `` (task) => `<div>Task ${task.model.label}</div>` `` |
| `taskElementHook` | `Function` | [Task element hook](#taskelementhook) | undefined |
| `tableWidth` | `Number` | Width of table, used with SvelteGanttTable module. | undefined |
| `tableHeaders` | `Array` | Headers of table, used with SvelteGanttTable module. | undefined |
| `columnStrokeColor` | `string` | Color of column lines. eg. `'#efefef'` | undefined |
| `columnStrokeWidth` | `number` | Width of column lines. | undefined |
| `layout` | `'overlap'`, `'pack'` | The layout used to arrange tasks in a row. | undefined |
| | | `'overlap'` Overlapping tasks display one over another (default). | undefined |
| | | `'pack'` Overlapping tasks shrink and display one above another. | undefined |
| `enableCreateTask` | `Boolean` | Enables creating new tasks by dragging. | undefined |
| `onCreateTask` | `({ from: number; to: number; resourceId: string \| number; }) => TaskModel` | This function provides the new task model when dragging to create task. | undefined |
| `onCreatedTask` | `(task: SvelteTask) => void` | Called after task was created by dragging. | undefined |

### TaskElementHook

Task element hook function, it is a svelte action, eg. `(node, task) => { node.addEventListener('click', console.log); return { destroy() { node.removeEventListener('click', console.log); } }; }`

### DateAdapter

A date adapter is an object of interface `{ format(date: number, format: string): string; }` that formats a date in UNIX miliseconds to a string using the specified format template, eg. 'MMMM Do'.


## Methods

-   `selectTask(id)` Selects task by id.
    -   `id` | `Number`|`String` | Id of task
-   `unselectTasks()` Unselects tasks.
-   `scrollToTask(id, scrollBehavior)` Scrolls the view to a task.
    -   `id` | `Number`|`String` | Id of task
    -   `scrollBehaviour` | `String` | `auto` or `smooth`.
-   `scrollToRow(id, scrollBehavior)` Scrolls the view to a row.

    -   `id` | `Number`|`String` | Id of row
    -   `scrollBehaviour` | `String` | `auto` or `smooth`.

-   `updateTask(model)` Updates or inserts task.
    -   `model` | `Task` | Task object
-   `updateTasks(models)` Updates or inserts tasks.
    -   `models` | `Array<Task>` | Task objects
-   `updateRow(model)` Updates or inserts row.
    -   `model` | `Row` | Row object
-   `updateRows(models)` Updates or inserts rows.

    -   `models` | `Array<Row>` | Row objects

-   `getTask(id)` Get task by id.
    -   `id` | `Number`|`String` | Id of task
-   `getRow(id)` Get row by id.
    -   `id` | `Number`|`String` | Id of row
-   `getTasks(rowId)` Get tasks by row id.
    -   `rowId` | `Number`|`String` | Id of row


## Events

Synchronously run callbacks on specific events. Subscribe to these after gantt is created.

```js
gantt.api.tasks.on.select(task => console.log('Listener: task selected', task));
```

### `gantt.api.tasks`

-   `move` | `task` | Runs while task is moving.
-   `switchRow` | `task`, `row`, `previousRow` | Runs when user switches row of task.
-   `select` | `task` | Runs when user selects task.
-   `moveEnd` | `task` | Runs when user stops moving task.
-   `change` | `task` | Runs after dropping a task, before it is updated.
-   `changed` | `task` | Runs after dropping a task, after it is updated.

## Available modules

-   `SvelteGanttTable` Renders a table on the left side of gantt. Needed for row labels.
-   `SvelteGanttDependencies` Renders dependencies between tasks.
-   `SvelteGanttExternal` Enables external DOM elements to be draggable to svelte-gantt. Useful for creating new tasks:

```js
new SvelteGanttExternal(
    // external DOM element
    document.getElementById('newTaskButton'),
    // options
    {
        // reference to instance of svelte-gantt
        gantt,
        // if enabled
        enabled: true,
        // success callback
        // row: row element was dropped on
        // date: date element was dropped on
        // gantt: instance of svelte-gantt
        onsuccess: (row, date, gantt) => {
            // here you can add a task to row, see './public/main.js'
        },
        // called when dragged outside main gantt area
        onfail: () => {},
        // factory function, creates HTMLElement that will follow the mouse
        elementContent: () => {
            const element = document.createElement('div');
            element.innerHTML = 'New Task';
            Object.assign(element.style, {
                position: 'absolute',
                background: '#eee',
                padding: '0.5em 1em',
                fontSize: '12px',
                pointerEvents: 'none'
            });
            return element;
        }
    }
);
```