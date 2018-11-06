//import SvelteGantt from './Grid.html';
//import moment from "../node_modules/moment/src/moment.js";
let startOfToday = moment().startOf('day')

let data = {
	rows: [],
	dependencies: []
}

for(let i = 0; i < 500; i++){
	data.rows.push({
		id: i,
		label: 'Row #'+i,
		tasks: [],
		enableDragging: true,
		//contentHtml: '<s>Test</s>'
		//headerHtml: '<s>Test</s>'
	});

	if(Math.random() < 0.5){
		data.rows[i].classes = ['penis-row'];
		data.rows[i].enableDragging = false;
	}

	let a = i % 3;

	data.rows[i].tasks.push({
		id: i,
		label: 'Task #'+i,
		from: startOfToday.clone().set({'hour': 3 + 5*a, 'minute': 0}),
		to: startOfToday.clone().set({'hour': 6 + 5*a, 'minute': 0}),
		amountDone: Math.floor(Math.random() * 100)
		//h: Math.random() < 0.5
	});


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

for(let i = 0; i < 499; i++){
	data.dependencies.push({
		id: i, 
		fromTask: i, 
		toTask: i+1 
	});
}

let options = {
	headers: [{unit: 'day', format: 'MMMM Do'}, {unit: 'hour', format: 'H:mm'}],
	width: 1000,
	from: startOfToday,
	to: moment().endOf('day'),
	tableHeaders: [{title: 'ID', property: 'id', width: 20}, {title: 'Label', property: 'label', width: 80}],
	modules: [SvelteGanttTable, SvelteGanttDependencies]
}

var app = SvelteGantt.create(document.body, data, options);