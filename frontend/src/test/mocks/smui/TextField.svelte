<script lang="ts">
  import { createEventDispatcher } from "svelte";
  
  export let value = "";
  export let type = "text";
  export let disabled = false;
  export let required = false;
  export let className = "";
  export let label = "";
  
  const dispatch = createEventDispatcher();
  
  function handleInput(event) {
    value = event.target.value;
    dispatch("input", { value });
  }
</script>

<div class="mdc-text-field {className}">
  <input
    {type}
    class="mdc-text-field__input"
    {value}
    {disabled}
    {required}
    on:input={handleInput}
    aria-label={label}
  />
</div>
