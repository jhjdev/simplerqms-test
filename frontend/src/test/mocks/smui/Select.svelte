<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let className = "";
  export let value = "";
  export let disabled = false;
  export let props: Record<string, any> = {};
</script>

<div class="select-field mdc-select smui-select--standard mdc-select--no-label mdc-menu-surface--anchor" style="">
  <div aria-controls="SMUI-select-menu" aria-expanded="false" class="mdc-select__anchor" role="combobox" tabindex="0">
    <span class="mdc-select__selected-text-container">
      <span class="mdc-select__selected-text" role="button">
        {value}
      </span>
    </span>
    <span class="mdc-select__dropdown-icon"></span>
    <div class="mdc-line-ripple" style=""></div>
  </div>
  
  <select 
    class="mdc-select {className}" 
    bind:value
    {disabled}
    on:change={(e) => dispatch("change", e.target.value)}
    {...props}
    style="display: none;"
  >
    <slot />
  </select>
</div>
