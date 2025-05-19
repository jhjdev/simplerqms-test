<script lang="ts">
  import type { Group, User } from '../types';
  import { slide } from 'svelte/transition';
  // @ts-ignore - SMUI imports
  import Textfield from '@smui/textfield';
  // @ts-ignore - SMUI imports
  import IconButton from '@smui/icon-button';
  // @ts-ignore - Type definitions
  import type { SvelteComponentTyped } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import '../styles/components/TreeNode.css';

  export let group: Group;
  export let editingGroupId: string | null;
  export let editingGroupName: string;
  export let handleEdit: (group: Group) => void;
  export let handleSave: (group: Group) => Promise<void>;
  export let handleDelete: (group: Group) => Promise<void>;
  export let handleCancel: () => void;

  // User editing state
  let editingUserId: string | null = null;
  let editingUserName: string = '';
  let editingUserEmail: string = '';
  let editingUserGroupId: string | null = null;
  
  const dispatch = createEventDispatcher<{
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
    groupUpdated: void;
  }>();

  let isExpanded = true;

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function hasChildren(group: Group): boolean {
    return (group.children && group.children.length > 0) || (group.users && group.users.length > 0);
  }

  function getChildGroups(group: Group): Group[] {
    return group.children || [];
  }

  function getUsers(group: Group): User[] {
    return group.users || [];
  }
  
  function handleEditUser(user: User): void {
    // Store current values before editing
    editingUserId = user.id;
    editingUserName = user.name;
    editingUserEmail = user.email;
    editingUserGroupId = group.id; // Current group
    console.log('Started editing user:', { id: user.id, name: user.name, email: user.email, groupId: group.id });
  }
  
  function handleCancelUserEdit(): void {
    editingUserId = null;
    // Don't clear the values here to prevent the name from disappearing
  }
  
  // The handleSave function is now provided as a prop from the parent component
  
  async function handleSaveUser(user: User): Promise<void> {
    console.log('handleSaveUser called with user:', user);
    console.log('Current editing state:', { editingUserName, editingUserEmail, editingUserGroupId });
    
    if (editingUserName && editingUserEmail) {
      try {
        // Create the event data
        const eventData = {
          userId: user.id,
          name: editingUserName,
          email: editingUserEmail,
          groupId: editingUserGroupId
        };
        
        // Log the event being dispatched for debugging
        console.log('About to dispatch userEdit event with data:', eventData);
        
        // Dispatch the event to the parent component
        dispatch('userEdit', eventData);
        console.log('Event dispatched successfully');
        
        // Update the user in the local data structure to prevent disappearing
        if (group.users) {
          const userIndex = group.users.findIndex(u => u.id === user.id);
          console.log('Found user at index:', userIndex);
          
          if (userIndex !== -1) {
            // Make a direct update to the user object
            console.log('Updating local user data');
            group.users[userIndex].name = editingUserName;
            group.users[userIndex].email = editingUserEmail;
            console.log('Updated user in local data:', group.users[userIndex]);
          }
        }
        
        // Force a UI update by creating a new array reference
        if (group.users) {
          group.users = [...group.users];
        }
        
        // Reset editing state
        console.log('Resetting editing state');
        editingUserId = null;
        
        // Alert for debugging
        alert('User edit event dispatched. Check console for details.');
      } catch (err) {
        // Type-safe error handling
        const error = err as Error;
        console.error('Error saving user:', error);
        alert('Failed to save user: ' + (error.message || 'Unknown error'));
      }
    } else {
      alert('Name and email are required');
    }
  }
</script>

<div class="tree-node">
  <div class="tree-node-content">
    <IconButton class="material-icons" on:click={toggleExpand}>
      {isExpanded ? 'expand_more' : 'chevron_right'}
    </IconButton>

    <div class="label-container">
      {#if editingGroupId === group.id}
        <div class="edit-field">
          <Textfield
            bind:value={editingGroupName}
            on:keydown={(e) => {
              const key = (e.detail || e).key;
              if (key === 'Enter') handleSave(group);
              if (key === 'Escape') handleCancel();
            }}
          />
        </div>
      {:else}
        <span class="node-label">
          <span class="material-icons">folder</span>
          {group.name} (Group)
        </span>
      {/if}
    </div>
  </div>
  <div class="tree-node-actions">
    {#if editingGroupId === group.id}
      <IconButton class="material-icons success" on:click={() => handleSave(group)}>
        check
      </IconButton>
      <IconButton class="material-icons danger" on:click={handleCancel}>
        close
      </IconButton>
    {:else}
      <IconButton class="material-icons" on:click={() => handleEdit(group)}>
        edit
      </IconButton>
      <IconButton class="material-icons danger" on:click={() => handleDelete(group)}>
        delete
      </IconButton>
    {/if}
  </div>
</div>

{#if isExpanded}
  <div class="tree-node-children" transition:slide>
    {#each getChildGroups(group) as child (child.id)}
      <svelte:self
        group={child}
        editingGroupId={editingGroupId}
        editingGroupName={editingGroupName}
        handleEdit={handleEdit}
        handleSave={handleSave}
        handleDelete={handleDelete}
        handleCancel={handleCancel}
      />
    {/each}
    {#each getUsers(group) as user (user.id)}
      <div class="tree-node" class:editing={editingUserId === user.id}>
        <div class="tree-node-content">
          <span class="indent-space"></span>
          <div class="label-container">
            {#if editingUserId === user.id}
              <form 
                class="edit-form"
                on:submit|preventDefault={() => handleSaveUser(user)}
              >
                <div class="edit-field user-edit-field">
                  <div class="form-field">
                    <label for="userName">Name</label>
                    <input 
                      id="userName"
                      type="text" 
                      bind:value={editingUserName} 
                      placeholder="User name"
                      required
                    />
                  </div>
                  
                  <div class="form-field">
                    <label for="userEmail">Email</label>
                    <input 
                      id="userEmail"
                      type="email" 
                      bind:value={editingUserEmail} 
                      placeholder="Email address"
                      required
                    />
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="save-button">
                      <span class="material-icons">save</span> Save
                    </button>
                    <button type="button" class="cancel-button" on:click={handleCancelUserEdit}>
                      <span class="material-icons">close</span> Cancel
                    </button>
                  </div>
                </div>
              </form>
            {:else}
              <span class="node-label">
                <span class="material-icons">person</span>
                {user.name} (User)
              </span>
            {/if}
          </div>
        </div>
        
        {#if editingUserId !== user.id}
          <div class="tree-node-actions">
            <button class="edit-button" on:click={() => handleEditUser(user)}>
              <span class="material-icons">edit</span>
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Remove all inline styles as they are now in TreeNode.css */
</style>
