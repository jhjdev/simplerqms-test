<script lang="ts">
  import { createEventDispatcher } from "svelte";
  
  export let disabled = false;
  export let className = "";
  export let style = "";
  
  const dispatch = createEventDispatcher();
</script>

<table class="mdc-data-table__table {className}" {style}>
  <slot />
</table>
