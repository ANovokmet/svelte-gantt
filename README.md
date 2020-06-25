# svelte-gantt
A lightweight and fast interactive gantt chart/resource booking component made with [Svelte](https://svelte.technology/). Works with any JS library or framework.

Dependent on [Moment.js](https://momentjs.com/)

Features include: Large datasets, drag'n'drop, tree view, zooming in/out, dependencies, date ranges...

DEMO: [Large dataset](https://anovokmet.github.io/svelte-gantt/),
[Tree](https://anovokmet.github.io/svelte-gantt/tree),
[Dependencies](https://anovokmet.github.io/svelte-gantt/dependencies)

## Installation (IIFE bundle)

 1. Clone or download repository.  
 2. Run the build:
```
node tools/build
```
 3. Include relevant css and javascript
    files from *./dist*:

```html
<link  rel='stylesheet'  href='public/gantt-default.css'>
<link  rel='stylesheet'  href='dist/css/svelteGantt.css'>

<script  src='moment.js'></script>
<script  src='dist/index.iife.js'></script>
```
Or use ES6 imports in your code:

```js
import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt';
```

 3. Initialize svelte-gantt:
```js
var gantt = new SvelteGantt({ 
	// target a DOM element
    target: document.getElementById('example-gantt'), 
	// svelte-gantt options
    props: options
});
```
..or run the example by opening *./public/index.html*

## Options

Pass options object as `props` to the SvelteGantt constructor. To update use `$set`, eg.
```js
gantt.$set({ 
    from: moment().startOf('week'),
    to: moment().endOf('week')
});
```

### Gantt
```js
var options = {
    /**
     * Rows to load in the gantt, see below
     */
    rows: []
    /**
     * Tasks that display in the gantt, see below
     */
    tasks: [],
    /**
     * Timeranges that display in the gantt, see below
     */
    timeRanges: [],
    /**
     * Dependencies that display in the gantt, used with the SvelteGanttDependencies module, see below
     */
    dependencies: [],
	// datetime timeline starts on, moment-js
	from: moment("9:00", "HH:mm"),
	// datetime timeline ends on, moment-js
	to: moment("17:00", "HH:mm"),
	// Minimum width of gantt area in px
	minWidth:  800, 
	// should timeline stretch width to fit
	fitWidth:  false,
	// minimum unit of time task date values will round to
	magnetUnit:  'minute',
	// amount of units task date values will round to
	magnetOffset:  15,
	// duration unit of columns
	columnUnit:  'minute',
	// duration width of column
	columnOffset:  15,
	// list of headers used for main gantt area
	// unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
	// format: datetime format used for header cell label
    headers: [{unit:  'day', format:  'DD.MM.YYYY'}, {unit:  'hour', format:  'HH'}],
    /**
     * List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
     */
	zoomLevels: [
		{
			headers: [
				{ unit: 'day', format: 'DD.MM.YYYY' },
				{ unit: 'hour', format: 'HH' }
			],
			minWidth: 800,
			fitWidth: true
		},
		{
			headers: [
				{ unit: 'hour', format: 'ddd D/M, H A' },
				{ unit: 'minute', format: 'mm', offset: 15 }
			],
			minWidth: 5000,
			fitWidth: false
		}
	],
	// height of a single row in px
	rowHeight: 52,
	rowPadding: 6,
	/** modules used in gantt */
    ganttTableModules: [SvelteGanttTable],
    ganttBodyModules: [SvelteGanttDependencies],
    /**
     * When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree. 
     */
    reflectOnParentRows: false,
    /**
     * When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree. 
     */
    reflectOnChildRows: true,
	// sets top level gantt class which can be used for styling
	classes:  '',
	// width of handle for resizing task
	resizeHandleWidth:  5,
	// handler of button clicks
	onTaskButtonClick:  (task) => { console.log('Clicked: ', task); },
	// task content factory function
    taskContent: (task) => `<div>Task ${task.model.label}</div>`,
    /**
     * Width of table, used with SvelteGanttTable module
     */
    tableWidth: 200,
    /**
     * Headers of table, used with SvelteGanttTable module
     */
    tableHeaders: [{ title: 'Name', property: 'label', width: 100 }]
};
```

### Row
Rows are defined as a list of objects. Rows can be rendered as a collapsible tree (rows are collapsed with SvelteGanttTable module). Row objects may have these parameters:
```js
options.rows = [{
	// id of row, every row needs to have a unique one
    id: 1234,
	// css classes
	classes: 'row-disabled',
	// html content of row, renders as background to a row
    contentHtml: '<div class="row-leave">On sick leave</s>',
	// enable dragging of tasks to and from this row
    enableDragging: true,
    // label of row, could be any other property, can be displayed with SvelteGanttTable
    label: 'Andrey Plenkovich',
    // html content of table row header, displayed in SvelteGanttTable
    headerHtml: '<s>Andrey Plenkovich <img src="image.jpg"></s>',
    // list of children row objects, these can have their own children
    children: []
}];
```
### Task
Tasks are defined as a list of objects. Each will render a row and has these parameters:
```js
options.tasks = [{
	// id of task, every task needs to have a unique one
	id: 91993,
	// completion %, indicated on task
	amountDone: 50,
	// css classes
	classes: 'shadow-sm',
	// datetime task starts on, currently moment-js object
	from: moment("9:00", "HH:mm"),
	// datetime task ends on, currently moment-js object
	to: moment("12:30", "HH:mm"),
	// label of task
	label: 'Weekly planning';
	// html content of task, will override label
	html: '<b>Weekly planning</b>',
	// show button bar
	showButton: false
	// button classes, useful for fontawesome icons
	buttonClasses: 'fa fa-gear'
	// html content of button
	buttonHtml: undefined,
	// enable dragging of task
	enableDragging:  true
}];
```

### Dependencies 
Renders a dependency between two tasks. Used by SvelteGanttDependencies module:
```ts
options.dependencies = [{
	// unique id of dependency
	id: 95,
    /** Id of dependent task */
    fromId: 13,
    /** Id of dependency task */
    toId: 9,
    /** Stroke color */
    stroke: 'red',
    /** Width of stroke */
    strokeWidth: 2,
    /** Size of the arrow head */
    arrowSize: 3
}];
```

### Time ranges
Renders a block of time spanning all the rows:
```ts
options.timeRanges = [{
    /** Unique id of time range */
    id: 15,
    /** Time from (moment) */
    from: time('10:00', 'HH:mm'),
    /** Time to (moment) */
    to: time('12:00', 'HH:mm'),
    /** CSS classes */
    classes: 'sg-lunch',
    /** Display label */
    label: 'Lunch'
}];
```


### Events
```js
// after svelte-gantt is created
gantt.api.tasks.on.move((task) =>  console.log('Listener: task move', task));
gantt.api.tasks.on.switchRow((task, row, previousRow) =>  console.log('Listener: task switched row', task));
gantt.api.tasks.on.select((task) =>  console.log('Listener: task selected', task));
gantt.api.tasks.on.moveEnd((task) =>  console.log('Listener: task move end', task));
```
### Available modules

 - *SvelteGanttTable*: Renders a table on the left side of gantt. Needed for row labels.
 - *SvelteGanttDependencies*: Renders dependencies between tasks.
 - *SvelteGanttExternal*: Enables external DOM elements to be draggable to svelte-gantt. Useful for creating new tasks:

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

## Development build

If you want to build from sources:
Install the dependencies...

```bash
cd svelte-gantt
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Issues

 - Transitions on task drop sometimes do not play - issue introduced in Svelte 3

## TBD

 - Context-menus (click on row, task or dependency)

