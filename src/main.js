import SvelteGantt from './Grid.html';
import moment from "../node_modules/moment/src/moment.js";
let startOfToday = moment().startOf('day')

let data = {
	rows: [],
	dependencies: []
}

for(let i = 0; i < 5000; i++){
	data.rows.push({
		id: i,
		label: 'Row #'+i,
		tasks: [
			{
				id: i,
				label: 'Task #'+i,
				from: startOfToday.clone().set({'hour': 9, 'minute': 0}),
				to: startOfToday.clone().set({'hour': 12, 'minute': 0})
			}
		]
	});
}
data.dependencies.push({fromTask: data.rows[0].tasks[0], toTask: data.rows[1].tasks[0] });
data.dependencies.push({fromTask: data.rows[2].tasks[0], toTask: data.rows[1].tasks[0] });

let options = {
	from: startOfToday,
	to: moment().endOf('day')
}

var app = SvelteGantt.create(document.body, data, options);

export default app;