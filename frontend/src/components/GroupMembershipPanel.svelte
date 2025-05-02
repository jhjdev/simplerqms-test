<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '@smui/button';
  import Select from '@smui/select';
  import type { Group, User } from '../types';

  export let groups: Group[] = [];
  export let users: User[] = [];

  const dispatch = createEventDispatcher();

  // State for membership check
  let selectedGroupId: string | null = null;
  let selectedMemberId: string | null = null;
  let selectedMemberType: 'user' | 'group' = 'user';
  let membershipResult: { isMember: boolean; path: string[] } | null = null;
  let isCheckingMembership = false;
  let membershipError = '';

  // State for all members
  let selectedGroupForMembers: string | null = null;
  let allMembersResult: { users: any[]; groups: any[] } | null = null;
  let isLoadingMembers = false;
  let membersError = '';
  
  // Dialog state
  let showSuccessDialog = false;
  let showErrorDialog = false;
  let dialogMessage = '';
  
  // Function to show dialog
  function showDialog(type: 'success' | 'error', message: string) {
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

  // Reset states
  function resetMembershipCheck() {
    membershipResult = null;
    membershipError = '';
  }

  function resetAllMembers() {
    allMembersResult = null;
    membersError = '';
  }

  // Check if a member is in a group hierarchy
  async function checkMembership() {
    if (!selectedGroupId) {
      membershipError = 'Please select a group';
      return;
    }

    if (!selectedMemberId) {
      membershipError = 'Please select a member';
      return;
    }

    resetMembershipCheck();
    isCheckingMembership = true;

    try {
      console.log('Checking membership for:', { groupId: selectedGroupId, memberId: selectedMemberId, memberType: selectedMemberType });
      const response = await fetch(`/api/groups/${selectedGroupId}/check-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: selectedMemberId,
          memberType: selectedMemberType
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to check membership: ${response.statusText}`);
      }

      membershipResult = await response.json();
      const isMember = membershipResult?.isMember || false;
      const path = membershipResult?.path || [];
      const pathText = path.length > 0 ? `Path: ${path.join(' → ')}` : '';
      const resultText = isMember 
        ? `✓ ${selectedMemberType === 'user' ? 'User' : 'Group'} is a member of this group hierarchy. ${pathText}` 
        : `✗ ${selectedMemberType === 'user' ? 'User' : 'Group'} is NOT a member of this group hierarchy.`;
      showDialog('success', resultText);
    } catch (error) {
      console.error('Error checking membership:', error);
      membershipError = error instanceof Error ? error.message : 'Failed to check membership';
      showDialog('error', membershipError);
    } finally {
      isCheckingMembership = false;
    }
  }

  // Get all members in a group hierarchy
  async function getAllMembers() {
    if (!selectedGroupForMembers) {
      membersError = 'Please select a group';
      return;
    }

    resetAllMembers();
    isLoadingMembers = true;

    try {
      console.log('Getting all members for group:', selectedGroupForMembers);
      const response = await fetch(`/api/groups/${selectedGroupForMembers}/all-members`);

      if (!response.ok) {
        throw new Error(`Failed to get all members: ${response.statusText}`);
      }

      allMembersResult = await response.json();
      const userCount = allMembersResult?.users?.length || 0;
      const groupCount = allMembersResult?.groups?.length || 0;
      showDialog('success', `Successfully retrieved all members: ${userCount} users and ${groupCount} groups in this hierarchy.`);
    } catch (error) {
      console.error('Error getting all members:', error);
      membersError = error instanceof Error ? error.message : 'Failed to get all members';
      showDialog('error', membersError);
    } finally {
      isLoadingMembers = false;
    }
  }
</script>

<div class="membership-panel">
  <h1>Group Membership Tools</h1>

  <div class="panels-container">
    <!-- Membership Check Panel -->
    <div class="panel">
      <div class="panel-header">
        <h3>Check Membership</h3>
      </div>
      <div class="panel-content">
        <div class="form-row">
          <select 
            class="custom-select" 
            bind:value={selectedGroupId} 
            on:change={() => resetMembershipCheck()}
          >
            <option value={null} disabled>Select a group</option>
            {#each groups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-row radio-group">
          <label class="radio-label">
            <input type="radio" bind:group={selectedMemberType} value="user" />
            <span>User</span>
          </label>
          <label class="radio-label">
            <input type="radio" bind:group={selectedMemberType} value="group" />
            <span>Group</span>
          </label>
        </div>

        <div class="form-row">
          <select 
            class="custom-select" 
            bind:value={selectedMemberId} 
            on:change={() => resetMembershipCheck()}
          >
            <option value={null} disabled>Select a {selectedMemberType}</option>
            {#if selectedMemberType === 'user'}
              {#each users as user}
                <option value={user.id}>{user.name}</option>
              {/each}
            {:else}
              {#each groups as group}
                <option value={group.id}>{group.name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <div class="form-actions">
          <Button 
            variant="raised" 
            on:click={checkMembership} 
            disabled={isCheckingMembership || !selectedGroupId || !selectedMemberId}
          >
            {isCheckingMembership ? 'Checking...' : 'Check Membership'}
          </Button>
        </div>

        {#if membershipError}
          <div class="error-message">{membershipError}</div>
        {/if}

        {#if membershipResult}
          <div class="result-container">
            <div class="result-paper">
              <h4>Result:</h4>
              <p class="membership-status {membershipResult.isMember ? 'is-member' : 'not-member'}">
                {membershipResult.isMember ? '✓ Is a member' : '✗ Not a member'}
              </p>
              {#if membershipResult.isMember && membershipResult.path && membershipResult.path.length > 0}
                <div class="path-container">
                  <h5>Path:</h5>
                  <ul class="path-list">
                    {#each membershipResult.path as pathItem, index}
                      <li>
                        {pathItem}
                        {#if index < membershipResult.path.length - 1}
                          <span class="path-arrow">→</span>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- All Members Panel -->
    <div class="panel">
      <div class="panel-header">
        <h3>View All Members</h3>
      </div>
      <div class="panel-content">
        <div class="form-row">
          <select 
            class="custom-select" 
            bind:value={selectedGroupForMembers} 
            on:change={() => resetAllMembers()}
          >
            <option value={null} disabled>Select a group</option>
            {#each groups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-actions">
          <Button 
            variant="raised" 
            on:click={getAllMembers} 
            disabled={isLoadingMembers || !selectedGroupForMembers}
          >
            {isLoadingMembers ? 'Loading...' : 'Get All Members'}
          </Button>
        </div>

        {#if membersError}
          <div class="error-message">{membersError}</div>
        {/if}

        {#if allMembersResult}
          <div class="result-container">
            <div class="result-paper">
              <h4>Members in Hierarchy:</h4>
              
              {#if allMembersResult.users && allMembersResult.users.length > 0}
                <div class="members-section">
                  <h5>Users ({allMembersResult.users.length}):</h5>
                  <ul class="members-list">
                    {#each allMembersResult.users as user}
                      <li>
                        <div class="member-item">
                          <span class="member-name">{user.name}</span>
                          <span class="member-email">{user.email}</span>
                          {#if user.path && user.path.length > 0}
                            <div class="member-path">
                              Path: {user.path.join(' → ')}
                            </div>
                          {/if}
                        </div>
                      </li>
                    {/each}
                  </ul>
                </div>
              {:else}
                <p>No users found in this group hierarchy.</p>
              {/if}

              {#if allMembersResult.groups && allMembersResult.groups.length > 0}
                <div class="members-section">
                  <h5>Groups ({allMembersResult.groups.length}):</h5>
                  <ul class="members-list">
                    {#each allMembersResult.groups as group}
                      <li>
                        <div class="member-item">
                          <span class="member-name">{group.name}</span>
                          {#if group.path && group.path.length > 0}
                            <div class="member-path">
                              Path: {group.path.join(' → ')}
                            </div>
                          {/if}
                        </div>
                      </li>
                    {/each}
                  </ul>
                </div>
              {:else}
                <p>No subgroups found in this group hierarchy.</p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Custom Success Dialog -->
{#if showSuccessDialog}
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showSuccessDialog = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessDialog = false)}>
    <div class="dialog success-dialog" on:click|stopPropagation on:keydown={() => {}}>
      <div class="dialog-header">
        <h3>Success</h3>
      </div>
      <div class="dialog-content" on:click={() => {}} on:keydown={() => {}}>
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
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showErrorDialog = false} on:keydown={(e) => e.key === 'Escape' && (showErrorDialog = false)}>
    <div class="dialog error-dialog" on:click|stopPropagation on:keydown={() => {}}>
      <div class="dialog-header">
        <h3>Error</h3>
      </div>
      <div class="dialog-content" on:click={() => {}} on:keydown={() => {}}>
        {dialogMessage}
      </div>
      <div class="dialog-actions">
        <Button on:click={() => showErrorDialog = false}>Close</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .membership-panel {
    padding: 20px;
    margin-top: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  h1 {
    color: #800020; /* Burgundy red */
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 2rem;
    font-weight: 300;
  }

  .panels-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .panel {
    flex: 1;
    min-width: 300px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #eee;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #1976d2; /* Same blue as the 'Create a new group' button */
  }

  .panel-content {
    padding: 16px;
  }

  .form-row {
    margin-bottom: 16px;
    width: 100%;
  }
  
  .custom-select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    font-size: 16px;
    margin-bottom: 10px;
  }

  .radio-group {
    display: flex;
    gap: 20px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .form-actions {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .error-message {
    color: #d32f2f;
    margin-top: 10px;
    font-size: 0.9rem;
  }

  .result-container {
    margin-top: 20px;
  }

  .result-paper {
    padding: 16px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .membership-status {
    font-weight: bold;
    font-size: 1.1rem;
    padding: 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .is-member {
    color: #2e7d32;
    background-color: rgba(46, 125, 50, 0.1);
  }

  .not-member {
    color: #d32f2f;
    background-color: rgba(211, 47, 47, 0.1);
  }

  .path-container {
    margin-top: 16px;
  }

  .path-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .path-list li {
    margin-right: 5px;
    display: flex;
    align-items: center;
  }

  .path-arrow {
    margin: 0 5px;
    color: #757575;
  }

  .members-section {
    margin-top: 16px;
  }

  .members-list {
    list-style: none;
    padding: 0;
  }

  .member-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
  }

  .member-name {
    font-weight: bold;
    margin-right: 10px;
  }

  .member-email {
    color: #757575;
    font-size: 0.9rem;
  }

  .member-path {
    font-size: 0.8rem;
    color: #757575;
    margin-top: 5px;
  }
  
  /* Dialog Styles */
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
</style>
