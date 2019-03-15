//import SvelteGantt from './Grid.html';
//import moment from "../node_modules/moment/src/moment.js";
let startOfToday = moment().startOf('day');

let generation = 0;
function generateData() {
	const data = {
		rows: [],
		tasks: [],
		dependencies: []
	}

	for(let i = 0; i < 1000; i++) {

		let rand_bool = Math.random() < 0.2;


		data.rows.push({
			generation,
			id: i,
			label: 'Row #'+i,
			tasks: [],
			enableDragging: true,
			imageSrc: 'Content/joe.jpg',
			//contentHtml: '<s>Test</s>'
			//headerHtml: '<s>Test</s>'
			classes: rand_bool ? ['row-disabled'] : undefined,
			enableDragging: !rand_bool
		});

		let a = i % 2;
		rand_bool = Math.random() > 0.9;
	
		data.tasks.push({
			generation,
			id: i,
			resourceId: i,
			label: 'Task #'+i,
			from: startOfToday.clone().set({'hour': 7 + 4*a, 'minute': 0}),
			to: startOfToday.clone().set({'hour': 10 + 4*a, 'minute': 0}),
			//amountDone: Math.floor(Math.random() * 100),
			classes: rand_bool ? 'task-status-1' : '',
			enableDragging: !rand_bool
			//h: Math.random() < 0.5
		});

		// data.tasks.push({
		// 	generation,
		// 	id: i + 1000,
		// 	resourceId: i,
		// 	label: 'Task #'+ (i + 1000),
		// 	from: startOfToday.clone().set({'hour': 12 + 4*a, 'minute': 0}),
		// 	to: startOfToday.clone().set({'hour': 14 + 4*a, 'minute': 0}),
		// 	//amountDone: Math.floor(Math.random() * 100),
		// 	classes: rand_bool ? 'task-status-1' : '',
		// 	enableDragging: !rand_bool
		// 	//h: Math.random() < 0.5
		// });
	}

	generation += 1;
	
	/*for(let i = 0; i < 499; i++) {
		data.dependencies.push({
			id: i, 
			fromTask: i, 
			toTask: i+1 
		});
	}*/

	return data;
}

/*setInterval(() => {
	for(let i = 0; i < 500; i++){
		let t = data.rows[i].tasks[0];
		if(t.h){
			t.amountDone += 1;
		}
		else{
			t.amountDone -= 1;
		}
	
		if(t.amountDone == 0 || t.amountDone == 100){
			t.h = !t.h
		}	
		t.updateView();
	}
}, 50)*/

const currentStart = startOfToday.clone().set({hour: 6, minute: 0});
const currentEnd = startOfToday.clone().set({hour: 18, minute: 0});

let options = {
	headers: [{unit: 'day', format: 'MMMM Do'}, {unit: 'hour', format: 'H:mm'}],
	stretchTimelineWidthToFit: true,
	width: 1000,
	from: currentStart,
	to: currentEnd,
	tableHeaders: [{title: 'Label', property: 'label', width: 140}],
	tableWidth: 140,
	modules: [SvelteGanttTable, SvelteGanttDependencies],
	//taskContent: (task) => '<i class="s-g-icon fas fa-calendar"></i>' + task.model.label
}

var gantt = SvelteGantt.create(document.getElementById('gc'), generateData(), options);

gantt.initTimeRanges([{
	id: 0, 
	from: startOfToday.clone().set({hour: 10, minute: 0}),
	to: startOfToday.clone().set({hour: 12, minute: 0}),
	classes: null,
	label: 'Lunch' //?
}]);

//gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
//gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
gantt.api.tasks.on.select((task) => console.log('Listener: task selected', task));
//gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
gantt.api.tasks.on.changed((task) => console.log('Listener: task changed', task));





document.getElementById('setDayView').addEventListener('click', (event) => {
	console.log('set day view');
	gantt.store.set({
		stretchTimelineWidthToFit: true,
		columnUnit: 'minute',
		columnOffset: 15
	});
	gantt.updateView({
		from: currentStart,
		to: currentEnd,
		//width: 1000,
		headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}]
	});
});

document.getElementById('setWeekView').addEventListener('click', (event) => {
	console.log('set week view');
	gantt.store.set({
		stretchTimelineWidthToFit: false,
		columnUnit: 'hour',
		columnOffset: 1
	});
	gantt.updateView({
		from: currentStart.clone().startOf('week'),
		to: currentStart.clone().endOf('week'),
		width: 5000,
		headers: [{unit: 'month', format: 'Mo YYYY'},{unit: 'day', format: 'DD'}]
	});
});

document.getElementById('setNextDay').addEventListener('click', (event) => {
	currentStart.add(1, 'day');
	currentEnd.add(1, 'day');
	console.log('set next day');

	gantt.updateView({
		from: currentStart,
		to: currentEnd,
		width: 1000,
		headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}]
	});
});


document.getElementById('setPreviousDay').addEventListener('click', (event) => {
	currentStart.subtract(1, 'day');
	currentEnd.subtract(1, 'day');
	console.log('set previous day');

	gantt.updateView({
		from: currentStart,
		to: currentEnd,
		width: 1000,
		headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}]
	});
});

document.getElementById('reInit').addEventListener('click', (event) => {
	
	console.log('re init');
	const data = generateData();
	gantt.initRows(data.rows);
	gantt.initTasks(data.tasks);
});

SvelteGanttExternal.create(document.getElementById('newTask'), {
	gantt,
	onsuccess: (row, date, g) => {
		const task = new g.task(gantt, {
			id: 5000+Math.floor(Math.random() * 1000),
			label: 'Task #'+4343,
			from: date,
			to: date.clone().add(3, 'hour'),
			amountDone: Math.floor(Math.random() * 100)
		});

		row.addTask(task);
		const { _allTasks, _taskCache } = g.get();
		_allTasks.push(task);
		_taskCache[task.model.id] = task;
	}
});