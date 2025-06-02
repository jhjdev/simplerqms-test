<script lang="ts">
  export let className = '';
</script>

<thead class={`mdc-data-table__header ${className}`.trim()}>
  <slot />
</thead> 