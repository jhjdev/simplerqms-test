<script lang="ts">
  import type { Group } from '../types';
  import Button from '@smui/button';
  import Textfield from '@smui/textfield';
  import Select, { Option } from '@smui/select';
  import Card, { Content } from '@smui/card';
  import { createEventDispatcher, onDestroy } from 'svelte';
  import '../styles/components/CreateEntityForm.css';

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
            <div class="form-field">
              <div class="textfield-wrapper">
                <span class="field-label">Enter group name</span>
                <Textfield
                  bind:value={groupName}
                  required
                  disabled={isLoading}
                  class="text-field"
                />
              </div>
            </div>
            
            <div class="form-field">
              <div class="select-wrapper">
                <span class="field-label">Parent Group</span>
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
          </div>

          <div class="button-container">
            <Button 
              variant="raised"
              type="submit"
              disabled={isLoading || !groupName.trim()}
              class="submit-button mdc-button--raised"
              style="background-color: var(--color-tertiary); color: white;"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>

      <div class="form-divider"></div>

      <div class="form-section">
        <h2>Create a new user</h2>
        
        <!-- User dialogs are now handled by the shared dialogs at the bottom -->

        <form on:submit={handleUserSubmit} class="form-fields">
          <div class="fields-wrapper">
            <div class="form-field">
              <div class="textfield-wrapper">
                <span class="field-label">Enter full name</span>
                <Textfield 
                  bind:value={userName}
                  required
                  disabled={isLoading}
                  class="text-field"
                />
              </div>
            </div>

            <div class="form-field">
              <div class="textfield-wrapper">
                <span class="field-label">Enter email address</span>
                <Textfield 
                  bind:value={userEmail}
                  type="email"
                  required
                  disabled={isLoading}
                  class="text-field"
                />
              </div>
            </div>

            <div class="form-field">
              <div class="select-wrapper">
                <span class="field-label">Assign to Group</span>
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

          <div class="button-container">
            <Button 
              variant="raised"
              type="submit"
              disabled={isLoading}
              class="submit-button mdc-button--raised"
              style="background-color: var(--color-tertiary); color: white;"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
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
  /* Remove all inline styles as they are now in CreateEntityForm.css */
</style>
