<script lang="ts">
  export let value = "";
  export let selected = false;
</script>

<option {value} {selected}>
  <slot />
</option>
