<script lang="ts">
  export let className = '';
  export let props: Record<string, any> = {};
</script>

<tr class="mdc-data-table__row {className}" {...props}>
  <slot />
</tr> 