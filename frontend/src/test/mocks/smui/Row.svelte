<script lang="ts">
  export let className = '';
</script>

<tr class={`mdc-data-table__row ${className}`.trim()}>
  <slot />
</tr> 