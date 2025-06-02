<script lang="ts">
  export let props: Record<string, any> = {};
  export let className: string = '';
</script>

<button class={`material-icons ${className}`} {...props}>
  <slot />
</button> 