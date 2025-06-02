<script lang="ts">
  export let className = '';
</script>

<td class={`mdc-data-table__cell ${className}`.trim()}>
  <slot />
</td> 