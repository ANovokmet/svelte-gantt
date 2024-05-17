<script>
    import {SvelteGantt, SvelteGanttTable} from 'svelte-gantt/svelte';
    import GetStarted from './GetStarted.svx';
    import { defaultOptions, time } from '$lib';
	import { onMount } from 'svelte';
    import Button from '$lib/components/Button.svelte';

    let expansionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            entry.target.classList.remove('opacity-0', 'translate-y-2');
            entry.target.classList.add('opacity-100',  'translate-y-0');
        })
    })

    onMount(() => {
        document.querySelectorAll(".loading").forEach(e => expansionObserver.observe(e));
    });

    let transform = '';
    document.addEventListener('scroll', event => {
        setTransform(document.documentElement.scrollTop);
    });
    setTransform(document.documentElement.scrollTop);

    function setTransform(scrollTop) {
        const scale = 1 - Math.min(scrollTop / 200, 1);
        transform = `transform: translate3d(0px, -${15 * scale}%, 0px) scale3d(1, 1, 1) rotateX(${10 * scale}deg) rotateY(0deg) rotateZ(0deg) skew(0deg);`;
    }
    
</script>


<main
    class="w-full mx-auto pt-8 992:min-h-[calc(100vh-var(--kd--navbar-height))] min-h-[calc(100vh-var(--kd--navbar-height))] px-6"
    style={`max-width: var(--kd-main-max-width, var(--kd-article-max-width));`}
>
    <section class="hero text-center mb-24 mt-12">
        <h1 class="text-6xl font-extrabold mb-2">
            Lightweight and fast interactive <span class=" bg-clip-text text-transparent bg-gradient-to-tr from-pink-500 to-violet-500">Gantt chart.</span>
        </h1>
    </section>

    <div class="skew-3d-wrap my-12">
        <div class="relative skew-3d --skew-3d shadow-2xl transition-all ease-linear" style={transform}>
            <div class="skew-3d-inner">
                <SvelteGantt from={time('8:00')} to={time('12:00')}
                    ganttTableModules={[SvelteGanttTable]}
                    rows={[
                        { id: 1, label: "Jedd Balden" }, 
                        { id: 2, label: "Rozele McFarland" }, 
                        { id: 3, label: "Chrissy Bullard" }, 
                        { id: 4, label: "Patience Leschelle" }, 
                        { id: 5, label: "Rosette Henrie" }
                    ]}
                    tasks={[
                        { id: 1, resourceId: 1, from: time('9:00'), to: time('10:00'), label: 'Work' },
                        { id: 2, resourceId: 2, from: time('9:30'), to: time('10:30'), label: 'Work' }
                    ]}
                    timeRanges={[
                        {
                            id: 0,
                            from: time('10:00'),
                            to: time('11:00'),
                            classes: 'time-range-lunch',
                            label: 'Lunch',
                            resizable: false,
                        }
                    ]}/>
            </div>
        </div>
    </div>
    <section class="hero text-center mb-24 mt-12 text-sm text-slate-700">
        <p class="mb-4">Svelte-gantt is a lightweight and fast interactive gantt chart/resource booking component made with Svelte.</p>
        <p>Compatible with any JavaScript library or framework. ZERO dependencies.</p>
    </section>

    <section class="flex flex-col mb-8">
        <a class="group text-white font-medium text-2xl transition-all hover:scale-105
            px-6 py-3
            text-soft
            mb-12
            bg-gradient-to-tr from-pink-500 to-violet-500 hover:bg-violet-600 mx-auto transition-all"
            href="/docs/getting-started/installation"> 
            <span class="inline-block transform transition-transform duration-100 group-hover:translate-x-0">Get started</span> 
        </a>
        <GetStarted />
    </section>


    <footer class="h-40 ">
<!--bg-gradient-0 to-transparent from-pink-500 -->
    </footer>

    <article class="markdown prose dark:prose-invert translate-y-2 opacity-0 transition-all loading duration-1000">
        
    </article>
</main>

<style lang="postcss">
    .skew-3d {
        will-change: transform;
        transform: translate3d(0px, -15%, 0px) scale3d(1, 1, 1) rotateX(10deg) rotateY(0deg) rotateZ(0deg) skew(0deg);
        /* transform-style: preserve-3d; */
    }

    .skew-3d:hover {
        will-change: transform;
        transform: none !important;
        /* scale: 1.2; */
        /* transform-style: preserve-3d; */
    }

    .skew-3d-inner {
        transform: perspective(1000px);
    }

    .skew-3d-wrap {
        perspective: 1000px;
        transform: rotate(0)perspective(1000px);
    }

    :global(div.sg-task) {
        @apply bg-slate-500;
    }

    :global(div.sg-task:hover) {
        @apply bg-slate-700;
    }
</style>