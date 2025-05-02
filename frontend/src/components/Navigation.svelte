<script lang="ts">
  let currentPath = window.location.pathname;

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    currentPath = path;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      currentPath = window.location.pathname;
    });
  }
</script>

<nav>
  <ul>
    <li>
      <a 
        href="/" 
        class:active={currentPath === '/' || currentPath === ''}
        on:click|preventDefault={() => navigate('/')}
      >
        Dashboard
      </a>
    </li>
    <li>
      <a 
        href="/users" 
        class:active={currentPath === '/users'}
        on:click|preventDefault={() => navigate('/users')}
      >
        Users
      </a>
    </li>
    <li>
      <a 
        href="/groups" 
        class:active={currentPath === '/groups'}
        on:click|preventDefault={() => navigate('/groups')}
      >
        Groups
      </a>
    </li>
  </ul>
</nav>

<style>
  nav {
    background-color: #f5f5f5;
    padding: 1rem;
    margin-bottom: 2rem;
    border-radius: 4px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1rem;
  }

  li {
    margin: 0;
  }

  a {
    color: #666;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  a:hover {
    background-color: #e0e0e0;
    color: #333;
  }

  a.active {
    background-color: #1976d2;
    color: white;
  }

  a.active:hover {
    background-color: #1565c0;
  }
</style>
