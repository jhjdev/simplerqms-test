<script lang="ts">
  export let props: Record<string, any> = {};
  export let className: string = '';
</script>

<td class={`mdc-data-table__cell ${className}`} {...props}>
  <slot />
</td> 