<script lang="ts">
  import UserTable from "./components/UserTable.svelte";
  import GroupTreeView from "./components/GroupTreeView.svelte";
  import EnhancedGroupTreeView from "./components/EnhancedGroupTreeView.svelte";
  import CreateEntityForm from "./components/CreateEntityForm.svelte";
  import GroupMembershipPanel from "./components/GroupMembershipPanel.svelte";
  import Button from '@smui/button';
  import { onMount } from 'svelte';
  import type { User, Group } from './types';

  let users: User[] = [];
  let groups: Group[] = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let currentPage = window.location.pathname === '/about' ? 'about' : (window.location.pathname === '/faq' ? 'faq' : 'home');
  
  // Dialog state
  let showSuccessDialog = false;
  let showErrorDialog = false;
  let dialogMessage = '';

  const API_URL = '/api'; // Define API_URL constant

  // Functions for checking group membership and getting all members
  async function checkMembership(groupId: string, memberId: string, memberType: 'user' | 'group') {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/check-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId, memberType })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check membership: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking membership:', error);
      return { isMember: false, path: [] };
    }
  }
  
  async function getAllMembers(groupId: string) {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/all-members`);
      
      if (!response.ok) {
        throw new Error(`Failed to get all members: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting all members:', error);
      return { users: [], groups: [] };
    }
  }

  function navigate(page: string) {
    currentPage = page;
    let path = '/';
    if (page === 'about') path = '/about';
    if (page === 'faq') path = '/faq';
    window.history.pushState({}, '', path);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      if (window.location.pathname === '/about') {
        currentPage = 'about';
      } else if (window.location.pathname === '/faq') {
        currentPage = 'faq';
      } else {
        currentPage = 'home';
      }
    });
  }

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

  async function fetchUsers() {
    try {
      isLoading = true;
      errorMessage = '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/users', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      users = data;
    } catch (error) {
      console.error('Error fetching users:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchUsers();
  });

  async function fetchGroups() {
    try {
      isLoading = true;
      errorMessage = '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/groups/hierarchy', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      groups = await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserSubmit(name: string, email: string, groupId: string | null) {
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      // Make sure we're sending all required fields including type
      const userData = { name, email, type: 'user', groupId: groupId || null };
      console.log('Submitting user data:', userData);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create user');
      }

      successMessage = 'User created successfully!';
      showDialog('success', successMessage);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error creating user:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserDelete(event: CustomEvent<{ userId: string }>) {
    const { userId } = event.detail;
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      successMessage = 'User deleted successfully!';
      showDialog('success', successMessage);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      errorMessage = 'Failed to delete user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    console.log('App component received userEdit event:', event.detail);
    const { userId, name, email, groupId } = event.detail;
    console.log('Extracted user edit details:', { userId, name, email, groupId });
    
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      console.log(`Making PATCH request to /api/users/${userId}`);
      console.log('Request payload:', { name, email, groupId });
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, groupId }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server returned error:', errorData);
        throw new Error(errorData.error || `Failed to update user (status: ${response.status})`);
      }

      const responseData = await response.json();
      console.log('User update successful, server response:', responseData);
      
      successMessage = 'User updated successfully!';
      showDialog('success', successMessage);
      console.log('Refreshing user list...');
      await fetchUsers(); // Refresh the user list
      console.log('User list refreshed');
    } catch (error) {
      console.error('Error updating user:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  // Handle group deletion
  async function handleGroupDeleted(event: CustomEvent<Group>) {
    const deletedGroup = event.detail;
    console.log('Group deleted:', deletedGroup);
    
    // Refresh the groups list
    await fetchGroups();
    
    // Show success message
    showDialog('success', `Group '${deletedGroup.name}' deleted successfully`);
  }
  
  // Fetch data when the component mounts
  fetchUsers();
  fetchGroups();
</script>

<div class="app">
  <header>
    <div class="header-content">
      <h1>Simpler QMS</h1>
      <p class="subtitle">Requirements Management System</p>
    </div>
  </header>

  <nav>
    <ul>
      <li>
        <a 
          href="/" 
          class:active={currentPage === 'home'}
          on:click|preventDefault={() => navigate('home')}
        >
          Home
        </a>
      </li>
      <li>
        <a 
          href="/about" 
          class:active={currentPage === 'about'}
          on:click|preventDefault={() => navigate('about')}
        >
          About
        </a>
      </li>
      <li>
        <a 
          href="/faq" 
          class:active={currentPage === 'faq'}
          on:click|preventDefault={() => navigate('faq')}
        >
          FAQ
        </a>
      </li>
    </ul>
  </nav>

  <main>
    {#if currentPage === 'home'}
      <div class="main-content" on:click={() => {}} on:keydown={() => {}}>
        <CreateEntityForm
          {groups}
          {isLoading}
          {errorMessage}
          {successMessage}
          onUserSubmit={handleUserSubmit}
          on:groupSubmit={() => fetchGroups()}
        />

        <EnhancedGroupTreeView
          groups={groups}
          users={users}
          on:groupUpdated={fetchGroups}
          on:groupDeleted={handleGroupDeleted}
          on:userEdit={handleUserEdit}
        />

        <UserTable
          {users}
          {groups}
        />
        
        <GroupMembershipPanel
          {users}
          {groups}
        />
      </div>
    {:else if currentPage === 'about'}
      <div class="about-content">
        <h1>SimplerQMS User and Group Management System</h1>
        
        <div class="about-section">
          <h2>About This Project</h2>
          <p>This project was originally a technical test for SimplerQMS that I have since expanded upon. I decided to use it as a learning tool to expand my skill set and create a showcase of various technologies and best practices in modern web development. Through this project, I've implemented testing frameworks, API documentation, UI enhancements, and CI/CD workflows to demonstrate a comprehensive approach to full-stack development.</p>
        </div>
        
        <div class="about-section">
          <h2>Overview</h2>
          <p>This application provides a comprehensive system for managing users, groups, and their hierarchical relationships. It includes both a RESTful API and a modern web interface for managing these entities.</p>
        </div>
        
        <div class="about-section">
          <h2>Features</h2>
          <ul>
            <li>Create, list, update, and delete users</li>
            <li>Create, list, update, and delete groups</li>
            <li>Add, remove, and list members of a group</li>
            <li>Check if a member is within a group hierarchy</li>
            <li>Get all members within a group hierarchy</li>
            <li>Support for group-to-group relationships (groups can contain other groups)</li>
            <li>Modern web interface for all operations</li>
          </ul>
        </div>
        
        <div class="about-section">
          <h2>Technology Stack</h2>
          <ul>
            <li><strong>Backend</strong>: Node.js with Express.js</li>
            <li><strong>Database</strong>: PostgreSQL</li>
            <li><strong>Frontend</strong>: Svelte with Material UI components</li>
            <li><strong>Containerization</strong>: Docker and Docker Compose</li>
          </ul>
        </div>
        
        <div class="about-section">
          <h2>Bonus Features Implemented</h2>
          
          <h3>Testing</h3>
          <ul>
            <li>Unit Tests: Backend API endpoint tests using Jest and Supertest</li>
            <li>Frontend Tests: Component tests using Vitest and Testing Library</li>
            <li>Test Configuration: Separate TypeScript configuration for tests</li>
          </ul>
          
          <h3>Documentation</h3>
          <ul>
            <li>API Documentation: Swagger/OpenAPI documentation for all endpoints</li>
            <li>User Guide: Comprehensive README with setup and usage instructions</li>
            <li>Code Documentation: JSDoc comments for better code understanding</li>
          </ul>
          
          <h3>UI Enhancements</h3>
          <ul>
            <li>Enhanced TreeView: Improved group hierarchy visualization with search functionality</li>
            <li>Member Count Display: Visual indicators of group size and hierarchy depth</li>
            <li>Expand/Collapse: Better navigation of complex hierarchies</li>
            <li>Accessibility Improvements: ARIA roles and keyboard navigation support</li>
          </ul>
          
          <h3>CI/CD</h3>
          <ul>
            <li>GitHub Actions: Automated testing and build pipeline</li>
            <li>Linting: Code quality checks integrated into CI pipeline</li>
            <li>Artifact Generation: Build artifacts for deployment</li>
          </ul>
        </div>
      </div>
    {:else}
      <div class="faq-content">
        <h2>Frequently Asked Questions</h2>
        
        <div class="faq-section">
          <h3>How to Access the Application</h3>
          <p>Here are the main access points for the SimplerQMS application:</p>
          
          <div class="link-section">
            <h4>Frontend Application</h4>
            <p>This is the main user interface for the SimplerQMS application:</p>
            <a href="http://localhost:5173" target="_blank" rel="noopener">Open Frontend Application</a>
          </div>
          
          <div class="link-section">
            <h4>API Endpoints</h4>
            <p>Direct access to the backend API endpoints:</p>
            <a href="http://localhost:3000/api/groups" target="_blank" rel="noopener">View All Groups</a>
            <a href="http://localhost:3000/api/groups/hierarchy" target="_blank" rel="noopener">View Group Hierarchy</a>
            <a href="http://localhost:3000/api/users" target="_blank" rel="noopener">View All Users</a>
          </div>
        </div>
        
        <div class="faq-section">
          <h3>How to Run Tests</h3>
          <p>To run the tests for the application:</p>
          <ol>
            <li>For backend tests: <code>docker compose exec node npm test</code></li>
            <li>For frontend tests: <code>docker compose exec frontend npm test</code></li>
          </ol>
        </div>
        
        <div class="faq-section">
          <h3>What features have been implemented?</h3>
          <ul>
            <li><strong>Testing</strong>: Simple but effective tests for both frontend and backend</li>
            <li><strong>Documentation</strong>: Comprehensive API documentation and user guides</li>
            <li><strong>UI Enhancements</strong>: Improved group hierarchy visualization with search</li>
            <li><strong>CI/CD</strong>: GitHub Actions workflow for automated testing and deployment</li>
          </ul>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- Custom Success Dialog -->
{#if showSuccessDialog}
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showSuccessDialog = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessDialog = false)}>
    <div class="dialog success-dialog" role="document" on:click|stopPropagation>
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
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showErrorDialog = false} on:keydown={(e) => e.key === 'Escape' && (showErrorDialog = false)}>
    <div class="dialog error-dialog" role="document" on:click|stopPropagation>
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
  .app {
    min-height: 100vh;
    background-color: #f5f7fa;
  }

  header {
    background-color: white;
    padding: 24px 0;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 500;
    color: #b71c1c;
  }

  .subtitle {
    margin: 8px 0 24px;
    font-size: 1.2rem;
    color: #757575;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  nav {
    background-color: white;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 24px;
  }

  nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
  }

  nav li {
    margin: 0;
  }

  nav a {
    display: block;
    padding: 16px 24px;
    color: #757575;
    text-decoration: none;
    transition: color 0.2s;
  }

  nav a:hover {
    color: #2e7d32;
  }

  nav a.active {
    color: #2e7d32;
    border-bottom: 2px solid #4a148c;
  }

  .about-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .about-content h1 {
    color: #800020; /* Burgundy red */
    font-weight: 300;
    margin-bottom: 24px;
    font-size: 2.5rem;
  }
  
  .about-section {
    margin-bottom: 30px;
  }
  
  .about-content h2, .about-section h2 {
    color: #1976d2 !important;
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    font-weight: 500;
  }
  
  .about-section h3 {
    color: #1976d2; /* Same blue as in other components */
    font-size: 1.4rem;
    margin: 20px 0 12px;
    font-weight: 400;
  }
  
  .about-section p {
    line-height: 1.6;
    margin-bottom: 16px;
    color: #444;
  }
  
  .about-section ul {
    padding-left: 20px;
    margin-bottom: 16px;
  }
  
  .about-section li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  
  .faq-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .about-content h2, .faq-content h2 {
    color: #333;
    margin-bottom: 20px;
  }

  .about-content p, .faq-content p {
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .faq-section {
    margin-bottom: 30px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .faq-section h3 {
    color: #2c3e50;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }
  
  .link-section {
    margin-bottom: 20px;
  }
  
  .link-section h4 {
    color: #3498db;
    margin-bottom: 10px;
  }
  
  .link-section a {
    display: inline-block;
    margin: 5px 10px 5px 0;
    padding: 8px 15px;
    background-color: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s;
  }
  
  .link-section a:hover {
    background-color: #2980b9;
  }
  
  .faq-content code {
    background-color: #f1f1f1;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: monospace;
  }

  .main-content {
    background: white;
    border-radius: 8px;
    margin: 0 auto;
    max-width: 1200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>
