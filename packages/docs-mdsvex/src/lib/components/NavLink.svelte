<script lang="ts">
	import { base } from '$app/paths';

	export let title: string;
	export let href: string;
</script>

<li class="mt-4 first:mt-0 992:mt-0">
	<a class="text-soft text-base font-base hover:underline hover:text-brand" href="{base}{href}">
		{title}
	</a>
</li>
