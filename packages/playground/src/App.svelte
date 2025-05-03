<script lang="ts">
  import * as SvelteGantt from 'svelte-gantt';
  import type { RowModel } from '../../svelte-gantt/src/core/row.svelte';
  import dayjs from 'dayjs';
  import { time } from './lib/utils';
  import { onMount } from 'svelte';

  const rows: RowModel[] = [
    { id: 'a', label: 'Row 1' },
    { id: 'b', label: 'Row 2' },
    { id: 'c', label: 'Row 3' },
    { id: 'ccc', label: 'Row 3' }
  ];

  for (let i = 0; i < 3; i++) {
    rows.push({
      id: 'g' + i,
      label: 'Row g' + i,

      children: [
        {
          id: 'c1' + i,
          label: 'Row c1' + i
        },
        {
          id: 'c2' + i,
          label: 'Row c2' + i
        }
      ]
    });
  }

  let tasks = [
    { id: 1, resourceId: 'a', from: time('9:00'), to: time('10:00'), label: 'Site visit', classes: 'sg-task-default' },
    { id: 2, resourceId: 'a', from: time('9:00'), to: time('12:15'), label: 'Development', classes: 'sg-task-default' },
    { id: 3, resourceId: 'a', from: time('8:30'), to: time('10:30'), label: 'Design', classes: 'sg-task-default' }
  ];

  let timeRanges = [
    {
      id: 0,
      from: time('10:00'),
      to: time('12:00'),
      classes: null,
      label: 'Lunch'
    },
    {
      id: 1,
      from: time('15:00'),
      to: time('17:00'),
      classes: null,
      label: 'Dinner'
    }
  ];

  let from = dayjs().startOf('day');
  let to = dayjs().endOf('day');

  let gantt: SvelteGantt.SvelteGantt;
  onMount(() => {
    (window as any).gantt = gantt;
  });

  let headers = [{ title: 'Title', property: 'label', type: 'tree' }];
</script>

<main>
  <SvelteGantt.SvelteGantt bind:this={gantt} {rows} tableHeaders={headers} {from} {to} {tasks} {timeRanges} ganttTableModules={[SvelteGantt.SvelteGanttTable]} />
</main>

<style>
  main {
    height: 400px;
  }
</style>
