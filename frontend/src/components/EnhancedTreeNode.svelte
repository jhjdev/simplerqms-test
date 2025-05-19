<script lang="ts">
  import type { Group, User } from '../types';
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import '../styles/components/EnhancedTreeNode.css';

  export let group: Group;
  export let editingGroupId: string | null;
  export let editingGroupName: string;
  export let handleEdit: (group: Group) => void;
  export let handleSave: (group: Group) => Promise<void>;
  export let handleDelete: (group: Group) => Promise<void>;
  export let handleCancel: () => void;
  export let expandedGroups: Set<string>;
  export let toggleExpand: (groupId: string) => void;
  export let showMemberCount: boolean;
  export let countAllMembers: (groupId: string) => number;

  // User editing state
  let editingUserId: string | null = null;
  let editingUserName: string = '';
  let editingUserEmail: string = '';
  let editingUserGroupId: string | null = null;
  
  const dispatch = createEventDispatcher<{
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
  }>();

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
  }
  
  function handleCancelUserEdit(): void {
    editingUserId = null;
  }
  
  async function handleSaveUser(user: User): Promise<void> {
    if (editingUserName && editingUserEmail) {
      try {
        // Create the event data
        const eventData = {
          userId: user.id,
          name: editingUserName,
          email: editingUserEmail,
          groupId: editingUserGroupId
        };
        
        // Dispatch the event to the parent component
        dispatch('userEdit', eventData);
        
        // Reset editing state
        editingUserId = null;
      } catch (error) {
        console.error('Error saving user:', error);
      }
    } else {
      alert('Name and email are required');
    }
  }
</script>

{#each getChildGroups(group) as childGroup (childGroup.id)}
  <div class="group-item" transition:fade={{ duration: 200 }}>
    <div class="group-header">
      <button 
        class="expand-btn" 
        on:click={() => toggleExpand(childGroup.id)}
        aria-label={expandedGroups.has(childGroup.id) ? 'Collapse group' : 'Expand group'}
      >
        <span class="expand-icon">{expandedGroups.has(childGroup.id) ? '▼' : '▶'}</span>
      </button>
      
      <div class="group-name">
        {#if editingGroupId === childGroup.id}
          <input 
            type="text" 
            bind:value={editingGroupName} 
            on:keydown={(e) => e.key === 'Enter' && handleSave(childGroup)}
          />
          <div class="edit-actions">
            <button class="save-btn" on:click={() => handleSave(childGroup)}>Save</button>
            <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
          </div>
        {:else}
          <span class="name">{childGroup.name}</span>
          {#if showMemberCount}
            <span class="member-count" title="Total members in this group">
              {countAllMembers(childGroup.id)}
            </span>
          {/if}
          <div class="actions">
            <button class="edit-btn" on:click={() => handleEdit(childGroup)}>Edit</button>
            <button class="delete-btn" on:click={() => handleDelete(childGroup)}>Delete</button>
          </div>
        {/if}
      </div>
    </div>
    
    {#if expandedGroups.has(childGroup.id)}
      <div class="group-children" transition:slide={{ duration: 200 }}>
        <svelte:self
          group={{
            ...childGroup,
            children: getChildGroups(childGroup),
            users: getUsers(childGroup)
          }}
          {editingGroupId}
          {editingGroupName}
          {handleEdit}
          {handleSave}
          {handleDelete}
          {handleCancel}
          {expandedGroups}
          {toggleExpand}
          {showMemberCount}
          {countAllMembers}
          on:userEdit
        />
      </div>
    {/if}
  </div>
{/each}

{#each getUsers(group) as user (user.id)}
  <div class="user-item" transition:fade={{ duration: 200 }}>
    {#if editingUserId === user.id}
      <div class="user-edit-form">
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
            placeholder="User email"
            required
          />
        </div>
        <div class="form-actions">
          <button class="save-btn" on:click={() => handleSaveUser(user)}>Save</button>
          <button class="cancel-btn" on:click={handleCancelUserEdit}>Cancel</button>
        </div>
      </div>
    {:else}
      <div class="user-info">
        <span class="user-icon">👤</span>
        <span class="user-name">{user.name}</span>
        <span class="user-email">{user.email}</span>
        <button class="edit-btn small" on:click={() => handleEditUser(user)}>Edit</button>
      </div>
    {/if}
  </div>
{/each}

<style>
  /* Remove all inline styles as they are now in EnhancedTreeNode.css */
</style>
