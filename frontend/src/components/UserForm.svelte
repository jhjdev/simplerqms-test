<script lang="ts">
  import type { ComponentType, SvelteComponentTyped } from 'svelte';
  import Button from '@smui/button';
  import Card, { Content, Actions } from '@smui/card';
  import Textfield from '@smui/textfield';
  import '../styles/components/UserForm.css';
  import type { User } from '../types';
  import { createEventDispatcher } from 'svelte';

  const props = $props<{
    onSubmit: (name: string, email: string) => Promise<void>;
    isLoading?: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>();

  let name = $state('');
  let email = $state('');

  async function handleSubmit() {
    await props.onSubmit(name, email);
    // Clear form if no error message is present (meaning submission was successful)
    if (!props.errorMessage) {
      name = '';
      email = '';
    }
  }
</script>

<Card class="form-card">
  <Content>
    <h2>Create a new user</h2>
    
    {#if props.errorMessage}
      <div class="error-message">{props.errorMessage}</div>
    {/if}
    
    {#if props.successMessage}
      <div class="success-message">{props.successMessage}</div>
    {/if}
    
    <div class="form-fields-container">
      <span>Full Name:</span>
      <div class="form-field">
        <Textfield 
          bind:value={name}
          required
          disabled={props.isLoading}
        />
      </div>
      <span>Email Address:</span>
      <div class="form-field">
        <Textfield 
          bind:value={email}
          type="email"
          required
          disabled={props.isLoading}
        />
      </div>
    </div>
  </Content>
  <Actions>
    <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <Button 
        variant="raised" 
        type="submit"
        disabled={props.isLoading}
        class="create-user-button"
        color="primary"
      >
      {props.isLoading ? 'Saving...' : 'Create User'}
    </Button>
    </form>
  </Actions>
</Card>

<style>
  /* Remove all inline styles as they are now in UserForm.css */
</style>

