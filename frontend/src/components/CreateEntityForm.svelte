<script lang="ts">
  import type { Group } from '../types';
  import Button from '@smui/button';
  import Textfield from '@smui/textfield';
  import Select, { Option } from '@smui/select';
  import Card, { Content } from '@smui/card';
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let groups: Group[] = [];
  export let onUserSubmit: (name: string, email: string, groupId: string | null) => Promise<void>;
  export let isLoading = false;
  export let errorMessage = '';
  export let successMessage = '';

  // User form state
  let userName = '';
  let userEmail = '';
  let userGroupId = '';

  // Group form state
  let groupName = '';
  let parentId = '';
  let groupSuccessMessage = '';
  let groupErrorMessage = '';
  
  // Dialog state
  let showSuccessDialog = false;
  let showErrorDialog = false;
  let dialogMessage = '';
  let dialogType = 'success'; // 'success' or 'error'

  const dispatch = createEventDispatcher();

  async function handleUserSubmit(e: Event) {
    e.preventDefault();
    console.log('Form submission values:', { userName, userEmail, userGroupId });
    await onUserSubmit(userName, userEmail, userGroupId || null);
    // Clear form if no error message is present
    if (!errorMessage) {
      userName = '';
      userEmail = '';
      userGroupId = '';
    }
    
    // Show appropriate dialog if there's a message
    if (successMessage) {
      showDialog('success', successMessage);
    } else if (errorMessage) {
      showDialog('error', errorMessage);
    }
  }

  async function handleGroupSubmit(event: Event) {
    event.preventDefault();
    if (!groupName) {
      showDialog('error', 'Please enter a group name');
      return;
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          parentId: parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const result = await response.json();
      console.log('Created group:', result);
      
      // Reset form
      (event.target as HTMLFormElement).reset();
      
      // Notify parent
      dispatch('groupSubmit');
      groupName = '';
      parentId = '';
      showDialog('success', 'Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create group';
      showDialog('error', errorMsg);
    }
  }
  
  // Function to show dialog
  function showDialog(type: 'success' | 'error', message: string) {
    dialogType = type;
    dialogMessage = message;
    if (type === 'success') {
      showSuccessDialog = true;
      // Auto-close success dialog after 3 seconds
      setTimeout(() => {
        showSuccessDialog = false;
      }, 3000);
    } else {
      showErrorDialog = true;
    }
  }
</script>

<Card class="form-card">
  <Content>
    <div class="forms-container">
      <div class="form-section">
        <h2>Create a new group</h2>
        
        <!-- Group dialogs are now handled by the shared dialogs at the bottom -->

        <form on:submit={handleGroupSubmit} class="form-fields">
          <div class="fields-wrapper">
            <span>Group Name:</span>
            <div class="form-field">
              <div class="textfield-wrapper">
                <Textfield
                  bind:value={groupName}
                  required
                  disabled={isLoading}
                  label="Group name"
                  input$placeholder=" "
                  class="text-field"
                />
              </div>
            </div>
            
            <span>Parent Group:</span>
            <div class="form-field">
              <Select
                bind:value={parentId}
                disabled={isLoading}
                class="select-field"
              >
                <Option value="">None</Option>
                {#each groups as group}
                  <Option value={group.id}>{group.name}</Option>
                {/each}
              </Select>
            </div>
          </div>

          <Button 
            variant="raised"
            type="submit"
            disabled={isLoading || !groupName.trim()}
            class="submit-button mdc-button--raised"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </div>

      <div class="form-divider"></div>

      <div class="form-section">
        <h2>Create a new user</h2>
        
        <!-- User dialogs are now handled by the shared dialogs at the bottom -->

        <form on:submit={handleUserSubmit} class="form-fields">
          <div class="fields-wrapper">
            <span>Full Name:</span>
            <div class="form-field">
              <div class="textfield-wrapper">
                <Textfield 
                  bind:value={userName}
                  required
                  disabled={isLoading}
                  label="Full name"
                  input$placeholder=" "
                  class="text-field"
                />
              </div>
            </div>

            <span>Email Address:</span>
            <div class="form-field">
              <div class="textfield-wrapper">
                <Textfield 
                  bind:value={userEmail}
                  type="email"
                  required
                  disabled={isLoading}
                  label="Email address"
                  input$placeholder=" "
                  class="text-field"
                />
              </div>
            </div>

            <span>Assign to Group:</span>
            <div class="form-field">
              <div class="select-wrapper">
                <Select
                  bind:value={userGroupId}
                  disabled={isLoading}
                  class="select-field"
                >
                  <Option value="">No group</Option>
                  {#each groups as group}
                    <Option value={group.id}>{group.name}</Option>
                  {/each}
                </Select>
              </div>
            </div>
          </div>

          <Button 
            variant="raised"
            type="submit"
            disabled={isLoading || !userName.trim() || !userEmail.trim()}
            class="submit-button mdc-button--raised"
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </div>
    </div>
  </Content>
</Card>

<!-- Custom Success Dialog -->
{#if showSuccessDialog}
<div class="dialog-overlay" on:click={() => showSuccessDialog = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessDialog = false)} tabindex="0" role="dialog" aria-modal="true">
  <div class="dialog success-dialog" on:click|stopPropagation on:keydown={() => {}}>
    <div class="dialog-header">
      <h3>Success</h3>
    </div>
    <div class="dialog-content">
      {dialogMessage}
    </div>
    <div class="dialog-actions">
      <Button on:click={() => showSuccessDialog = false}>Close</Button>
    </div>
  </div>
</div>
{/if}

<!-- Custom Error Dialog -->
{#if showErrorDialog}
<div class="dialog-overlay" on:click={() => showErrorDialog = false} on:keydown={(e) => e.key === 'Escape' && (showErrorDialog = false)} tabindex="0" role="dialog" aria-modal="true">
  <div class="dialog error-dialog" on:click|stopPropagation on:keydown={() => {}}>
    <div class="dialog-header">
      <h3>Error</h3>
    </div>
    <div class="dialog-content">
      {dialogMessage}
    </div>
    <div class="dialog-actions">
      <Button on:click={() => showErrorDialog = false}>Close</Button>
    </div>
  </div>
</div>
{/if}

<style>
  :global(.form-card) {
    margin-bottom: 2rem;
  }

  .forms-container {
    display: flex;
    gap: 2rem;
    min-height: 400px;
  }

  .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .form-divider {
    width: 1px;
    background-color: #e0e0e0;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    color: #1976d2;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .fields-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 350px;
  }

  :global(.text-field) {
    background-color: transparent !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    padding: 0 12px !important;
  }

  :global(.text-field .mdc-text-field__input) {
    padding: 20px 12px 6px !important;
  }

  :global(.text-field .mdc-floating-label) {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    pointer-events: none;
    transition: transform 0.1s ease-out;
  }

  :global(.text-field .mdc-floating-label--float-above) {
    transform: translateY(-130%) scale(0.75);
    left: 12px;
  }

  :global(.mdc-text-field:hover) {
    border-color: #999 !important;
  }

  :global(.mdc-text-field:focus-within) {
    border-color: var(--mdc-theme-primary) !important;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
  }

  :global(.mdc-text-field .mdc-floating-label) {
    color: rgba(0, 0, 0, 0.6) !important;
    font-size: 14px !important;
  }

  :global(.mdc-text-field:focus-within .mdc-floating-label) {
    color: var(--mdc-theme-primary) !important;
  }

  :global(.mdc-text-field__input) {
    padding: 12px 0 !important;
    font-size: 14px !important;
  }

  :global(.submit-button) {
    width: auto !important;
    min-width: 120px !important;
    align-self: flex-start;
    margin-top: 1rem;
    background-color: var(--mdc-theme-primary) !important;
    color: white !important;
  }

  :global(.mdc-button--raised) {
    background-color: var(--mdc-theme-primary) !important;
    color: white !important;
  }

  .form-field {
    width: 100%;
  }

  :global(.form-field .mdc-text-field) {
    width: 100%;
  }

  :global(.select-field) {
    width: 100% !important;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    background-color: transparent !important;
    min-height: 48px !important;
  }



  :global(.select-field:hover) {
    border-color: #999 !important;
  }

  :global(.select-field:focus-within) {
    border-color: var(--mdc-theme-primary) !important;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
  }

  :global(.select-field .mdc-select__selected-text) {
    position: relative !important;
    display: block !important;
    height: auto !important;
    min-height: 24px !important;
    line-height: 1.5 !important;
    margin: 0 !important;
    padding: 0 32px 0 0 !important;
  }

  :global(.select-field .mdc-select__anchor) {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    height: auto !important;
    min-height: 48px !important;
    padding: 4px 12px !important;
  }

  :global(.select-field .mdc-select__dropdown-icon) {
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
  }

  :global(.mdc-select__menu .mdc-list-item) {
    min-height: 48px !important;
    height: auto !important;
    padding: 12px !important;
    line-height: 1.5 !important;
  }

  span {
    display: block;
    margin-bottom: 0.10rem;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .dialog {
    background-color: white;
    border-radius: 4px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }
  
  .success-dialog {
    border-left: 4px solid #2e7d32;
  }
  
  .error-dialog {
    border-left: 4px solid #d32f2f;
  }
  
  .dialog-header {
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
  }
  
  .dialog-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .success-dialog .dialog-header h3 {
    color: #2e7d32;
  }
  
  .error-dialog .dialog-header h3 {
    color: #d32f2f;
  }
  
  .dialog-content {
    padding: 16px 24px;
    flex-grow: 1;
  }
  
  .dialog-actions {
    padding: 8px 16px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #eee;
  }

  :global(.submit-button) {
    margin-top: auto;
    width: auto;
  }

  /* No longer needed as we're using dialogs */
</style>
