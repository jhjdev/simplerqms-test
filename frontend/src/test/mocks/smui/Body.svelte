<script lang="ts">
  export let className = '';
</script>

<tbody class={`mdc-data-table__body ${className}`.trim()}>
  <slot />
</tbody> 