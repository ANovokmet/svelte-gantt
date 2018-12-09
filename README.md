
*work in progress*

---

# svelte-gantt
A lightweight and fast interactive gantt chart/resource booking component made with [Svelte](https://svelte.technology/).

Dependent on [Moment.js](https://momentjs.com/)

## Installation

 1. Clone or download repository.  
 2. Include relevant css and javascript
    files from *./public*:

```html
<link  rel='stylesheet'  href='gantt-default.css'>
<link  rel='stylesheet'  href='svelteGantt.css'>

<script  src='moment.js'></script>
<script  src='svelteGantt.js'></script>
```

 3. Initialize svelte-gantt:
```js
var gantt = SvelteGantt.create(
	// target a DOM element
	document.body, 
	// svelte-gantt data model
	data, 
	// svelte-gantt options
	options
);
```
..or run the example by opening *./public/index.html*

### Modules
To use modules with your gantt, include relevant files too:
```html
<link rel='stylesheet' href='svelteGantt.css'>
<link rel='stylesheet' href='svelteGanttDependencies.css'>
<link rel='stylesheet' href='svelteGanttTable.css'>
<script src='svelteGanttDependencies.js'></script>
<script src='svelteGanttTable.js'></script>
<script src='svelteGanttExternal.js'></script>
```
... and include them in options.modules.

## Options

### Gantt
```js
options = {
	// datetime timeline starts on, currently moment-js object
	from:  null,
	// datetime timeline ends on, currently moment-js object
	to:  null,
	// width of main gantt area in px
	width:  800, //rename to timelinewidth
	// should timeline stretch width to fit, true overrides timelineWidth
	stretchTimelineWidthToFit:  false,
	// height of main gantt area in px
	height:  400,
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
	// height of a single row in px
	rowHeight:  24,
	// modules used in gantt
	modules: [],
	// enables right click context menu
	enableContextMenu:  false,
	// sets top level gantt class which can be used for styling
	classes:  '',
	// width of handle for resizing task
	resizeHandleWidth:  5,
	// handler of button clicks
	onTaskButtonClick:  null, // e.g. (task) => {debugger},
	// task content factory function
	taskContent:  null  // e.g. (task) => '<div>Custom task content</div>'
};
```

### Data
Holds data and keeps it updated as svelte-gantt is interacted with:
```js
data  = {
	// array of row objects
	rows: [],
	// array of dependency objects, svelteGanttDependencies module
	dependencies: []
}
```

### Row
Renders a row:
```js
row = {
	// id of row, every row needs to have a unique one
	id: 0,
	// css classes
	classes: '',
	// html content of row
	contentHtml: undefined,
	// enable dragging of tasks to and from this row
	enableDragging:  true,
	// array of task elements
	tasks: []
}
```


### Task
Renders a task inside a row:
```js
task = {
	// id of task, every task needs to have a unique one
	id: 0;
	// completion %, indicated on task
	amountDone:  0;
	// css classes
	classes: '';
	// datetime task starts on, currently moment-js object
	from: null;
	// datetime task ends on, currently moment-js object
	to: null;
	// label of task
	label: undefined;
	// html content of task, will override label
	html: undefined;
	// show button bar
	showButton: false
	// button classes, useful for fontawesome icons
	buttonClasses: ''
	// html content of button
	buttonHtml: undefined
}
```

### Dependencies 
Renders a dependency between two tasks. Used by svelteGanttDependencies module:
```js
dependency = {
	// unique id of dependency
	id:  0,
	// id of dependent task
	fromTask:  0,
	// id of task that the task is dependent on
	toTask:  1
}
```
### Events
```js
// after svelte-gantt is created with SvelteGantt.create
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
SvelteGanttExternal.create(
	// external DOM element
	document.getElementById('newTaskButton'), 
	// options
	{
		// reference to your svelte-gantt 
		gantt,
		// callback
		// row: row element was dropped on
		// date: date element was dropped on
		// g: svelte-gantt
		onsuccess: (row, date, g) => {
			// here you can add a task to row, see './public/main.js'
		}
	}
);
```

## Build

  

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

## TBD

 - Milestones 
 - Context-menus (click on row, task or dependency)
 - Animations

