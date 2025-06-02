<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let disabled = false;
  export let type = "button";
  export let className = "";
  export let style = "";
  export let color = "primary";
  export let variant = "text";
</script>

<button
  {type}
  {disabled}
  class="mdc-button {variant} {className}"
  {style}
  on:click={(e) => dispatch("click", e)}
>
  <slot />
</button>
