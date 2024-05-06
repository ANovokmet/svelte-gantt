<script lang="ts">
    import { page } from '$app/stores';
  
    export let title: string;
    export let href: string;
  </script>
  
  <li class="mt-4 first:mt-0 992:mt-0">
    <a
      class="text-soft text-base hover:font-medium font-base hover:underline hover:text-brand"
      href={href}
    >
      {title}
    </a>
  </li>