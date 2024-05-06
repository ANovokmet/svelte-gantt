<script>
    export let title;
</script>

<li class="992:mt-10 mt-12 first:mt-0">
    <h5 class="text-strong 992:mb-3 mb-8 text-lg font-semibold">
        {title}
    </h5>
    <ul class="border-border space-y-3 border-l">
        <li class="first:mt-6">
            <slot></slot>
        </li>
    </ul>
</li>