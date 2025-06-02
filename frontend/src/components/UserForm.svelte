<script lang="ts">
  import type { SvelteComponentTyped } from 'svelte';
  import Button from '@smui/button';
  import Card, { Content, Actions } from '@smui/card';
  import Textfield from '@smui/textfield';
  import '../styles/components/UserForm.css';
  import type { User } from '../types';
  import { createEventDispatcher } from 'svelte';

  export let onSubmit: (name: string, email: string) => Promise<void>;
  export let isLoading: boolean = false;
  export let errorMessage: string = '';
  export let successMessage: string = '';

  let name = '';
  let email = '';
  
  async function handleSubmit() {
    await onSubmit(name, email);
    // Clear form if no error message is present (meaning submission was successful)
    if (!errorMessage) {
      name = '';
      email = '';
    }
  }
</script>

<Card class="form-card">
  <Content>
    <h2>Create a new user</h2>
    
    {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
    {/if}
    
    {#if successMessage}
      <div class="success-message">{successMessage}</div>
    {/if}
    
    <div class="form-fields-container">
      <span>Full Name:</span>
      <div class="form-field">
        <Textfield 
          bind:value={name}
          required
          disabled={isLoading}
        />
      </div>
      <span>Email Address:</span>
      <div class="form-field">
        <Textfield 
          bind:value={email}
          type="email"
          required
          disabled={isLoading}
        />
      </div>
    </div>
  </Content>
  <Actions>
    <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <Button 
        variant="raised" 
        type="submit"
        disabled={isLoading}
        class="create-user-button"
        color="primary"
      >
      {isLoading ? 'Saving...' : 'Create User'}
    </Button>
    </form>
  </Actions>
</Card>

<style>
  /* Remove all inline styles as they are now in UserForm.css */
</style>

