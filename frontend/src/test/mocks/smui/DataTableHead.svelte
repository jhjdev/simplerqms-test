<script lang="ts">
  export let className = '';
  export let props: Record<string, any> = {};
</script>

<thead class="mdc-data-table__header {className}" {...props}>
  <slot />
</thead> 