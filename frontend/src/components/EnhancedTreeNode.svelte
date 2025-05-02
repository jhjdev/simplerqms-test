<script lang="ts">
  import type { Group, User } from '../types';
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';

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
  .group-item {
    margin-bottom: 8px;
  }
  
  .group-header {
    display: flex;
    align-items: center;
  }
  
  .expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    margin-right: 4px;
    color: #555;
  }
  
  .expand-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    text-align: center;
    line-height: 16px;
    font-size: 10px;
  }
  
  .group-name {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
  }
  
  .name {
    flex: 1;
    font-weight: 500;
  }
  
  .member-count {
    background: #e0e0e0;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
    margin-left: 8px;
  }
  
  .actions, .edit-actions {
    display: flex;
    gap: 8px;
  }
  
  .edit-btn, .delete-btn, .save-btn, .cancel-btn {
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .edit-btn {
    background: #e0e0e0;
  }
  
  .edit-btn.small {
    padding: 2px 6px;
    font-size: 11px;
  }
  
  .delete-btn {
    background: #ffebee;
    color: #d32f2f;
  }
  
  .save-btn {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .cancel-btn {
    background: #e0e0e0;
  }
  
  .group-children {
    margin-left: 24px;
    border-left: 1px dashed #ddd;
    padding-left: 16px;
  }
  
  .user-item {
    margin: 8px 0;
    padding-left: 24px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    background: #f9f9f9;
    border-radius: 4px;
    border-left: 3px solid #2196f3;
  }
  
  .user-icon {
    margin-right: 8px;
    font-size: 14px;
  }
  
  .user-name {
    font-weight: 500;
    margin-right: 12px;
  }
  
  .user-email {
    color: #666;
    font-size: 13px;
    margin-right: auto;
  }
  
  .user-edit-form {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    margin: 4px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .form-field {
    margin-bottom: 12px;
  }
  
  .form-field label {
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
    color: #555;
  }
  
  .form-field input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
