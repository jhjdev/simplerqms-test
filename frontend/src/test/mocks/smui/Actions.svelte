<script lang="ts">
  export let className = '';
</script>

<div class={`mdc-card__actions ${className}`}>
  <slot />
</div>

<style>
  .mdc-card__actions {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem;
  }
</style> 