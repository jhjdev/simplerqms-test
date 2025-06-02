<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '@smui/button';
  import Select from '@smui/select';
  import type { Group, User } from '../types';
  import '../styles/components/GroupMembershipPanel.css';

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
  <h2>Group Membership Tools</h2>

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
            aria-label="Select Group"
            data-testid="check-membership-group-select"
          >
            <option value={null} disabled>Select a group</option>
            {#each groups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-row radio-group">
          <label class="radio-label">
            <input 
              type="radio" 
              bind:group={selectedMemberType} 
              value="user"
              aria-label="User"
            />
            <span>User</span>
          </label>
          <label class="radio-label">
            <input 
              type="radio" 
              bind:group={selectedMemberType} 
              value="group"
              aria-label="Group"
            />
            <span>Group</span>
          </label>
        </div>

        <div class="form-row">
          <select 
            class="custom-select" 
            bind:value={selectedMemberId} 
            on:change={() => resetMembershipCheck()}
            aria-label="Select Member"
            data-testid="check-membership-member-select"
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
            class="mdc-button--raised"
            style="background-color: var(--color-tertiary); color: white;"
            data-testid="check-membership-button"
          >
            {isCheckingMembership ? 'Checking...' : 'Check Membership'}
          </Button>
        </div>

        {#if membershipError}
          <div class="error-message">{membershipError}</div>
        {/if}

        <div class="result-container">
          {#if membershipResult}
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
          {/if}
        </div>
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
            aria-label="Select Group"
            data-testid="all-members-group-select"
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
            class="mdc-button--raised"
            style="background-color: var(--color-tertiary); color: white;"
            data-testid="get-all-members-button"
          >
            {isLoadingMembers ? 'Loading...' : 'Get All Members'}
          </Button>
        </div>

        {#if membersError}
          <div class="error-message">{membersError}</div>
        {/if}

        <div class="result-container">
          {#if allMembersResult}
            <div class="result-paper">
              <h4>Members:</h4>
              {#if allMembersResult.users && allMembersResult.users.length > 0}
                <div class="members-section">
                  <h5>Users:</h5>
                  <ul class="members-list">
                    {#each allMembersResult.users as user}
                      <li class="member-item">
                        <span class="member-name">{user.name}</span>
                        <span class="member-email">({user.email})</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if allMembersResult.groups && allMembersResult.groups.length > 0}
                <div class="members-section">
                  <h5>Groups:</h5>
                  <ul class="members-list">
                    {#each allMembersResult.groups as group}
                      <li class="member-item">
                        <span class="member-name">{group.name}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/if}
        </div>
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
  /* Remove all inline styles as they are now in GroupMembershipPanel.css */
</style>
