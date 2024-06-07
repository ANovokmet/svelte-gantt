<script>
	import { SvelteGantt, SvelteGanttTable, MomentSvelteGanttDateAdapter } from 'svelte-gantt';
	import { onMount } from 'svelte';
	import moment from 'moment';

	function time(input) {
		return moment(input, 'HH:mm');
	}

	const rows = [
		{
			id: 11,
			label: 'Petunia Mulliner'
		},
		{
			id: 12,
			label: 'Mélina Giacovetti'
		},
		{
			id: 13,
			label: 'Marlène Lasslett'
		},
		{
			id: 14,
			label: 'Adda Youell'
		}
	];

	let i = 0;
	let gantt;
	onMount(() => {
		gantt = new SvelteGantt({
			target: document.getElementById('example-gantt'),
			props: {
				dateAdapter: new MomentSvelteGanttDateAdapter(moment),
				rows: rows,
				tasks: [],
				headers: [
					{ unit: 'day', format: 'MMMM Do' },
					{ unit: 'hour', format: 'H:mm' }
				],
				fitWidth: true,
				minWidth: 400,
				from: time('06:00'),
				to: time('14:00'),
				tableHeaders: [{ title: 'Label', property: 'label', width: 140, type: 'tree' }],
				tableWidth: 180,
				ganttTableModules: [SvelteGanttTable],
				enableCreateTask: true,
				onCreateTask: (e) => {
					i++;
					return {
						id: i,
						label: `New task ${i}`,
						...e
					};
				},
				onCreatedTask: (task) => {
					console.log('task created', task);
				}
			}
		});
	});
</script>

<div id="example-gantt"></div>
