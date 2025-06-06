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
  export let userName = '';
  export let userEmail = '';
  export let userGroupId = '';

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

  // Function to flatten group hierarchy for select options
  function flattenGroups(groups: Group[], level = 0): { id: string; name: string; level: number }[] {
    let result: { id: string; name: string; level: number }[] = [];
    
    for (const group of groups) {
      result.push({ id: String(group.id), name: '  '.repeat(level) + group.name, level });
      if (group.children && group.children.length > 0) {
        result = result.concat(flattenGroups(group.children, level + 1));
      }
    }
    
    return result;
  }

  // Get flattened groups for select options
  $: flattenedGroups = flattenGroups(groups);

  async function handleUserSubmit(event: Event) {
    event.preventDefault();
    
    // Validate required fields
    if (!userName.trim() || !userEmail.trim()) {
      showDialog('error', 'Name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      showDialog('error', 'Please enter a valid email address');
      return;
    }

    // Call onUserSubmit with the form values
    await onUserSubmit(userName, userEmail, userGroupId || null);
    
    // Reset form
    userName = '';
    userEmail = '';
    userGroupId = '';
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
          parent_id: parentId || null,
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

        <form on:submit={handleGroupSubmit} class="form-fields" data-testid="group-form">
          <div class="fields-wrapper">
            <div class="form-field">
              <div class="textfield-wrapper">
                <span class="field-label">Enter group name</span>
                <Textfield
                  bind:value={groupName}
                  required
                  disabled={isLoading}
                  class="text-field"
                  data-testid="group-name-input"
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
                  data-testid="parent-group-select"
                >
                  <Option value="">None</Option>
                  {#each flattenedGroups as group}
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
              data-testid="create-group-button"
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

        <form on:submit={handleUserSubmit} class="form-fields" data-testid="user-form">
          <div class="fields-wrapper">
            <div class="form-field">
              <div class="textfield-wrapper">
                <span class="field-label">Enter full name</span>
                <Textfield 
                  bind:value={userName}
                  required
                  disabled={isLoading}
                  class="text-field"
                  data-testid="user-name-input"
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
                  data-testid="user-email-input"
                />
              </div>
            </div>

            <div class="form-field">
              <div class="select-wrapper">
                <span class="field-label">Select Group</span>
                <Select
                  bind:value={userGroupId}
                  disabled={isLoading}
                  class="select-field"
                  data-testid="user-group-select"
                >
                  <Option value="">None</Option>
                  {#each flattenedGroups as group}
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
              data-testid="create-user-button"
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
<div class="dialog-overlay" on:click={() => showSuccessDialog = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessDialog = false)} tabindex="0" role="dialog" aria-modal="true" data-testid="success-dialog-overlay">
  <div class="dialog success-dialog" on:click|stopPropagation on:keydown={() => {}} data-testid="success-dialog">
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
<div class="dialog-overlay" on:click={() => showErrorDialog = false} on:keydown={(e) => e.key === 'Escape' && (showErrorDialog = false)} tabindex="0" role="dialog" aria-modal="true" data-testid="error-dialog-overlay">
  <div class="dialog error-dialog" on:click|stopPropagation on:keydown={() => {}} data-testid="error-dialog">
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
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .dialog {
    background: white;
    border-radius: 4px;
    padding: 20px;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .success-dialog {
    border-top: 4px solid var(--color-success);
  }

  .error-dialog {
    border-top: 4px solid var(--color-error);
  }

  .dialog-header {
    margin-bottom: 15px;
  }

  .dialog-header h3 {
    margin: 0;
    color: var(--color-text);
  }

  .dialog-content {
    margin-bottom: 20px;
    color: var(--color-text);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
