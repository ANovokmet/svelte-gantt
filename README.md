
*work in progress*

---

# svelte-gantt
A lightweight and fast interactive gantt chart/resource booking component made with [Svelte](https://svelte.technology/).

Dependent on [Moment.js](https://momentjs.com/)

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
import { create as createGantt, SvelteGanttTable } from 'svelte-gantt';
```

 3. Initialize svelte-gantt:
```js
var gantt = create(
	// target a DOM element
	document.body, 
	// svelte-gantt data model
	data, 
	// svelte-gantt options
	options
);
```
..or run the example by opening *./public/index.html*

## Options

### Gantt
```js
options = {
	// datetime timeline starts on, moment-js
	from: moment("9:00", "HH:mm"),
	// datetime timeline ends on, moment-js
	to: moment("17:00", "HH:mm"),
	// width of main gantt area in px
	width:  800, 
	// should timeline stretch width to fit, true overrides timelineWidth
	stretchTimelineWidthToFit:  false,
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
	rowHeight:  52,
	// modules used in gantt
	modules: [],
	// enables right click context menu
	enableContextMenu:  false,
	// sets top level gantt class which can be used for styling
	classes:  '',
	// width of handle for resizing task
	resizeHandleWidth:  5,
	// handler of button clicks
	onTaskButtonClick:  (task) => { console.log('Clicked: ', task); },
	// task content factory function
	taskContent: (task) => `<div>Task ${task.model.label}</div>` 
};
```

### Data
Holds data and keeps it updated as svelte-gantt is interacted with:
```js
data  = {
    // array of task objects
    tasks: [],
	// array of row objects
    rows: []
}
```

### Row
Renders a row:
```js
{
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
    headerHtml: '<s>Andrey Plenkovich <img src="image.jpg"></s>'
}
```


### Task
Renders a task inside a row:
```js
{
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
}
```

### Dependencies 
Renders a dependency between two tasks. Used by SvelteGanttDependencies module:
```ts
{
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
		// if enabled
    	enabled: true,
		// callback
		// row: row element was dropped on
		// date: date element was dropped on
		// g: svelte-gantt
		onsuccess: (row, date, g) => {
			// here you can add a task to row, see './public/main.js'
		}
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

## TBD

 - Context-menus (click on row, task or dependency)

