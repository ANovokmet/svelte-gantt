<script lang="ts">
	import { page } from '$app/stores';

	export let title: string;
	export let href: string;

	// TODO:: active state
</script>

<li class="mt-4 first:mt-0 992:mt-0">
	<a class="text-soft text-base font-base hover:underline hover:text-brand" {href}>
		{title}
	</a>
</li>
