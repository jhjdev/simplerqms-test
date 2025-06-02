<script lang="ts">
  export let className = '';
</script>

<div class={`mdc-card__content ${className}`}>
  <slot />
</div>

<style>
  .mdc-card__content {
    padding: 1rem;
  }
</style> 