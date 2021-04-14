# svelte-gantt

A **lightweight** and **fast** interactive gantt chart/resource booking component made with [Svelte](https://svelte.technology/). Compatible with any JS library or framework.

![GitHub package.json version](https://img.shields.io/github/package-json/v/ANovokmet/svelte-gantt)

![svelte-gantt](https://i.imgur.com/IqT5PL4.png)

Dependent on [Moment.js](https://momentjs.com/).

Features include: Large datasets, drag'n'drop, tree view, zooming in/out, dependencies, date ranges...

DEMO: [Large dataset](https://anovokmet.github.io/svelte-gantt/),
[Tree](https://anovokmet.github.io/svelte-gantt/#/tree),
[Dependencies](https://anovokmet.github.io/svelte-gantt/#/dependencies)

# Installation

```
npm install svelte-gantt
```

Use ES6 imports in your code:

```js
import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt';
```

or use the IIFE build:

```html
<link  rel='stylesheet'  href='node_modules/svelte-gantt/css/svelteGantt.css'>

<script  src='moment.js'></script>
<script  src='node_modules/svelte-gantt/index.iife.js'></script>
```

 3. Initialize svelte-gantt:
```js
var options = {
    /* ... */
};

var gantt = new SvelteGantt({ 
    // target a DOM element
    target: document.getElementById('example-gantt'), 
    // svelte-gantt options
    props: options
});
```
..or run the example by opening *./public/index.html*

# Documentation

Pass options object as `props` to the SvelteGantt constructor. To update use `$set`, eg.
```js
gantt.$set({ 
    from: moment().startOf('week'),
    to: moment().endOf('week')
});
```

- `rows` {`Array`} Rows to load in the gantt, see below.
- `tasks` {`Array`} Tasks that display in the gantt, see below.
- `timeRanges` {`Array`} Timeranges that display in the gantt, see below.
- `dependencies` {`Array`} Dependencies that display in the gantt, used with the SvelteGanttDependencies module, see below.
- `from` {`Moment`} Datetime timeline starts on.
- `to` {`Moment`} Datetime timeline ends on.
- `minWidth` {`Number`} Minimum width of gantt area in px.
- `fitWidth` {`Boolean`} Should timeline stretch width to fit.
- `magnetUnit` {`String`} Minimum unit of time task date values will round to.
- `magnetOffset` {`Number`} Amount of units task date values will round to.
- `columnUnit` {`String`} Duration unit of columns.
- `columnOffset` {`Number`} Duration width of column.
    - eg. `columnUnit: 'minute', columnOffset: 15` will create a column for every 15 minutes.
- `headers` {`Array`} List of headers used for main gantt area.
- `zoomLevels` {`Array`} List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
- `rowHeight` {`Number`} Height of a single row in px.
- `rowPadding` {`Number`} Padding of a single row in px.
- `ganttTableModules` {`Array`} Modules used in gantt table area.
    - eg. `[SvelteGanttTable]`
- `ganttBodyModules` {`Array`} Modules used in gantt body area.
    - eg. `[SvelteGanttDependencies]`
- `reflectOnParentRows` {`Boolean`} When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree. 
- `reflectOnChildRows` {`Boolean`} When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree. 
- `classes` {`String`|`Array`} Custom CSS classes to apply to gantt.
- `resizeHandleWidth` {`Number`} Width of handle for resizing tasks, in px.
- `onTaskButtonClick` {`Function`} Callback for task button clicks.
    - eg. `(task) => console.log('clicked on: ', task)`
- `taskContent` {`Function`} ,task content factory function.
    - eg. `` (task) => `<div>Task ${task.model.label}</div>` ``
- `tableWidth` {`Number`} Width of table, used with SvelteGanttTable module.
- `tableHeaders` {`Array`} Headers of table, used with SvelteGanttTable module.
- `columnStrokeColor` {`string`} Color of column lines.
    - eg. `'#efefef'`
- `columnStrokeWidth` {`number`} Width of column lines.

## Header

Represents a row of header cells that render over the gantt.

- `unit` {`String`} Time unit used to display header cells.
    - eg. `'day'` will create a cell in the header for each day in the timeline.
- `format` {`String`} Datetime format used to label header cells.
    - eg. `'DD.MM.YYYY'`, `'HH'`
- `offset` {`Number`} Duration width of header cell.
- `sticky` {`Boolean`} Use sticky positioning for header labels.


## Table Header

Represents a single column rendered in SvelteGanttTable.

- `title` {`String`} Label to display in the table column header.
- `property` {`String`} Property of row to display in table column cells. 
- `width` {`Number`} Width of table column, in px.

## Zoom level

Represents a zoom level which cycle on ctrl+scroll.

- `headers` {`Array`} See above.
- `minWidth` {`Number`} See above.
- `fitWidth` {`Boolean`} See above.

## Row

Rows are defined as a list of objects. Rows can be rendered as a collapsible tree (rows are collapsed with SvelteGanttTable module). Row objects may have these parameters:

- `id` {`Number`|`String`} Id of row, every row needs to have a unique one.
- `classes` {`String`|`Array`} Custom CSS classes to apply to row.
- `contentHtml` {`String`} Html content of row, renders as background to a row.
- `enableDragging` {`Boolean`} enable dragging of tasks to and from this row.
- `label` {`String`} Label of row, could be any other property, can be displayed with SvelteGanttTable.
- `headerHtml` {`String`} Html content of table row header, displayed in SvelteGanttTable.
- `children` {`Array`} List of children row objects, these can have their own children.

## Task
Tasks are defined as a list of objects:

- `id` {`Number`|`String`} Id of task, every task needs to have a unique one.
- `amountDone` {`Number`} Task completion in percent, indicated on task.
- `classes` {`String`|`Array`} Custom CSS classes to apply to task.
- `from` {`Moment`} Datetime task starts on.
- `to` {`Moment`} Datetime task ends on.
- `label` {`String`} Label of task.
- `html` {`String`} Html content of task, will override label.
- `showButton` {`Boolean`} Show button bar.
- `buttonClasses` {`String`|`Array`} Button classes, useful for fontawesome icons.
- `buttonHtml` {`String`} Html content of button.
- `enableDragging` {`Boolean`} enable dragging of task.

## Dependencies 

Renders a dependency between two tasks. Used by SvelteGanttDependencies module:

- `id` {`Number`|`String`} Unique id of dependency.
- `fromId` {`Number`|`String`} Id of dependent task.
- `toId` {`Number`|`String`} Id of dependency task.
- `stroke` {`String`} Stroke color.
    - eg. `'red'` or `'#ff0000'`
- `strokeWidth` {`Number`} Width of stroke.
- `arrowSize` {`Number`} Size of the arrow head.

## Time ranges

Renders a block of time spanning all the rows:

- `id` {`Number`|`String`} Unique id of time range.
- `from` {`Moment`} Datetime timeRange starts on.
- `to` {`Moment`} Datetime timeRange ends on.
- `classes` {`String`|`Array`} Custom CSS classes.
- `label` {`String`} Display label.

## Methods

- `selectTask(id)` Selects task by id.
    - `id` {`Number`|`String`} Id of task
- `unselectTasks()` Unselects tasks.
- `scrollToTask(id, scrollBehavior)` Scrolls the view to a task.
    - `id` {`Number`|`String`} Id of task
    - `scrollBehaviour` {`String`} `auto` or `smooth`.
- `scrollToRow(id, scrollBehavior)` Scrolls the view to a row.
    - `id` {`Number`|`String`} Id of row
    - `scrollBehaviour` {`String`} `auto` or `smooth`.

- `updateTask(model)` Updates or inserts task.
    - `model` {`Task`} Task object
- `updateTasks(models)` Updates or inserts tasks.
    - `models` {`Array<Task>`} Task objects
- `updateRow(model)` Updates or inserts row.
    - `model` {`Row`} Row object
- `updateRows(models)` Updates or inserts rows.
    - `models` {`Array<Row>`} Row objects

- `getTask(id)` Get task by id.
    - `id` {`Number`|`String`} Id of task
- `getRow(id)` Get row by id.
    - `id` {`Number`|`String`} Id of row
- `getTasks(rowId)` Get tasks by row id.
    - `rowId` {`Number`|`String`} Id of row

## Events

Synchronously run callbacks on specific events. Subscribe to these after gantt is created.

```js
gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
```

### `gantt.api.tasks`

- `move` (`task`) Runs while task is moving.
- `switchRow` (`task`, `row`, `previousRow`) Runs when user switches row of task.
- `select` (`task`) Runs when user selects task.
- `moveEnd` (`task`) Runs when user stops moving task.
- `change` (`task`) Runs after dropping a task, before it is updated.
- `changed` (`task`) Runs after dropping a task, after it is updated.

## Available modules

 - `SvelteGanttTable` Renders a table on the left side of gantt. Needed for row labels.
 - `SvelteGanttDependencies` Renders dependencies between tasks.
 - `SvelteGanttExternal` Enables external DOM elements to be draggable to svelte-gantt. Useful for creating new tasks:

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
        onfail: () => { },
        // factory function, creates HTMLElement that will follow the mouse
        elementContent: () => {
            const element = document.createElement('div');
            element.innerHTML = 'New Task';
            Object.assign(element.style, {
                position: 'absolute',
                background: '#eee',
                padding: '0.5em 1em',
                fontSize: '12px',
                pointerEvents: 'none',
            });
            return element;
        }
    }
);
```

# Development build

If you want to build from sources:
Install the dependencies...

```bash
cd svelte-gantt
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev:docs
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Build the package

To build the package yourself:

 1. Clone or download repository.  
 2. Run the build:
```
node tools/build
```
 3. The package is built in *./dist*


# Issues

 - Transitions on task drop sometimes do not play - issue introduced in Svelte 3

# TBD

 - Context-menus (click on row, task or dependency)

