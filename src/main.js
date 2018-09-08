import SvelteGantt from './Grid.html';
import moment from "../node_modules/moment/src/moment.js";
let startOfToday = moment().startOf('day')

let data = {
	rows: [],
	dependencies: []
}

for(let i = 0; i < 500; i++){
	data.rows.push({
		id: i,
		label: 'Row #'+i,
		tasks: []
	});

	let a = i % 3;

	data.rows[i].tasks.push({
		id: i,
		label: 'Task #'+i,
		from: startOfToday.clone().set({'hour': 3 + 5*a, 'minute': 0}),
		to: startOfToday.clone().set({'hour': 6 + 5*a, 'minute': 0}),
		amountDone: Math.floor(Math.random() * 100)
	});
}

for(let i = 0; i < 499; i++){
	data.dependencies.push({
		id: i, 
		fromTask: data.rows[i].tasks[0], 
		toTask: data.rows[i+1].tasks[0] 
	});
}

let options = {
	from: startOfToday,
	to: moment().endOf('day')
}

var app = SvelteGantt.create(document.body, data, options);

export default app;