<script lang="ts">
  export let className = '';
</script>

<div class={`mdc-card ${className}`}>
  <slot />
</div>

<style>
  .mdc-card {
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
</style> 