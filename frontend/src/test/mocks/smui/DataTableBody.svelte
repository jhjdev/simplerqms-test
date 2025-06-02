<script lang="ts">
  export let props: Record<string, any> = {};
  export let className: string = '';
</script>

<div role="rowgroup" class={className}>
  <slot />
</div> 