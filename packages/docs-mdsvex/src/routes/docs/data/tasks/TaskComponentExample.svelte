<script>
	import { SvelteGantt } from 'svelte-gantt/svelte';
	import { time, format } from '$lib';
	import './TaskComponentExample.css';

	function taskComponent(node, task) {
		const div = document.createElement('div');
		div.className = '';

		function render(task) {
			div.innerHTML = `
<div class="task__header">
    <div class="task__title">${task.title}</div>
    <div class="task__subtitle">${format(task.from, 'MMM DD')} - ${format(task.to, 'H:mm')}</div>

    <div class="task__menu">
    <i class="fa fa-ellipsis-vertical"></i>
    </div>
</div>
<div class="task__footer">
    <div class="task__tags">
    <span class="task__tag violet">
        <i class="task__icon-archive-box"></i>
    </span>
    <span class="task__tag amber">
        • ${task.priority}
    </span>
    </div>
    <div class="task__assignees">
        ${task.assignees.map((a) => `<span class="task__assignee">${a}</span>`)}
    </div>
</div>`;
		}

		render(task);
		node.appendChild(div);

		return {
			update(task) {
				console.log(task);
				render(task);
			},
			destroy() {
				node.remove();
			}
		};
	}
</script>

<div class="example border">
	<SvelteGantt
		from={time('8:00')}
		to={time('14:00')}
		minWidth={200}
		fitWidth={true}
		rowHeight={140}
		taskElementHook={taskComponent}
		rows={[
			{ id: 1, label: 'Row 1' },
			{ id: 2, label: 'Row 2' }
		]}
		tasks={[
			{
				id: 1,
				resourceId: 1,
				from: time('8:30'),
				to: time('11:00'),
				label: ' ',
				title: 'Employee Details page',
				classes: 'task',
				priority: 'Medium',
				assignees: ['AD', 'BC', 'TE']
			},
			{
				id: 2,
				resourceId: 2,
				from: time('9:30'),
				to: time('13:00'),
				label: ' ',
				title: 'Documentation page',
				classes: 'task',
				priority: 'High',
				assignees: ['AN', 'TE']
			}
		]}
	/>
</div>

<style>
</style>
