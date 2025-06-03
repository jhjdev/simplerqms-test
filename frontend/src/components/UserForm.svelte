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
  let localError = '';
  
  function validateEmail(email: string) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit() {
    localError = '';
    if (!name.trim() || !email.trim()) {
      localError = 'Name and email are required.';
      return;
    }
    if (!validateEmail(email)) {
      localError = 'Please enter a valid email address.';
      return;
    }
    await onSubmit(name, email);
    // Clear form if submission was successful (successMessage is set)
    if (successMessage && !errorMessage) {
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
    
    {#if localError}
      <div class="error-message">{localError}</div>
    {/if}
    
    <div class="form-fields-container">
      <span>Full Name:</span>
      <div class="form-field">
        <Textfield 
          bind:value={name}
          required
          disabled={isLoading}
          data-testid="name-input"
        />
      </div>
      <span>Email Address:</span>
      <div class="form-field">
        <Textfield 
          bind:value={email}
          type="email"
          required
          disabled={isLoading}
          data-testid="email-input"
        />
      </div>
    </div>
  </Content>
  <Actions>
    <form on:submit={e => { e.preventDefault(); handleSubmit(); }} data-testid="user-form">
      <Button 
        variant="raised" 
        type="submit"
        disabled={isLoading}
        class="create-user-button"
        color="primary"
        data-testid="submit-button"
      >
      {isLoading ? 'Saving...' : 'Create User'}
    </Button>
    </form>
  </Actions>
</Card>

<style>
  /* Remove all inline styles as they are now in UserForm.css */
</style>

