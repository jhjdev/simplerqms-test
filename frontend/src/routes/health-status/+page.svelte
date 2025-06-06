<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@smui/button';
  import Card from '@smui/card';
  import IconButton from '@smui/icon-button';
  import { fade, fly } from 'svelte/transition';

  interface ServiceStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    service: string;
  }

  interface HealthStatus {
    api: ServiceStatus | null;
    database: ServiceStatus | null;
    system: ServiceStatus | null;
  }

  let healthStatus: HealthStatus = {
    api: null,
    database: null,
    system: null
  };
  let loading = true;
  let error: string | null = null;
  let lastCheck = new Date();

  async function checkHealth() {
    try {
      loading = true;
      error = null;
      
      // Check system health
      const systemResponse = await fetch('/health');
      if (!systemResponse.ok) {
        throw new Error(`System health check failed: ${systemResponse.statusText}`);
      }
      healthStatus.system = await systemResponse.json();

      // Check API health
      const apiResponse = await fetch('/api/health');
      if (!apiResponse.ok) {
        throw new Error(`API health check failed: ${apiResponse.statusText}`);
      }
      healthStatus.api = await apiResponse.json();

      // Check database health
      const dbResponse = await fetch('/api/health/database');
      if (!dbResponse.ok) {
        throw new Error(`Database health check failed: ${dbResponse.statusText}`);
      }
      healthStatus.database = await dbResponse.json();

      lastCheck = new Date();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to check health status';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    checkHealth();
  });
</script>

<main class="health-status">
  <div class="main-content">
    <div class="header">
      <h1>System Health</h1>
      <p class="subtitle">Monitor the status of all system components</p>
    </div>

    <div class="actions">
      <Button
        variant="raised"
        color="primary"
        on:click={checkHealth}
        disabled={loading}
      >
        <span class="material-icons">refresh</span>
        Refresh Status
      </Button>
    </div>

    {#if error}
      <div class="error-message" in:fade={{ duration: 200 }}>
        <span class="material-icons">error</span>
        <p>{error}</p>
      </div>
    {/if}

    <div class="status-grid">
      {#if healthStatus.system}
        <Card class="status-card">
          <div class="card-content" in:fly={{ y: 20, duration: 200, delay: 0 }}>
            <div class="card-header">
              <span class="material-icons">computer</span>
              <h3>System Status</h3>
            </div>
            <div class="status-indicator {healthStatus.system.status}">
              <span class="material-icons">
                {healthStatus.system.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.system.status.toUpperCase()}</p>
            </div>
            <p class="service-name">{healthStatus.system.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.system.timestamp).toLocaleString()}
            </p>
          </div>
        </Card>
      {/if}

      {#if healthStatus.api}
        <Card class="status-card">
          <div class="card-content" in:fly={{ y: 20, duration: 200, delay: 100 }}>
            <div class="card-header">
              <span class="material-icons">api</span>
              <h3>API Status</h3>
            </div>
            <div class="status-indicator {healthStatus.api.status}">
              <span class="material-icons">
                {healthStatus.api.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.api.status.toUpperCase()}</p>
            </div>
            <p class="service-name">{healthStatus.api.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.api.timestamp).toLocaleString()}
            </p>
          </div>
        </Card>
      {/if}

      {#if healthStatus.database}
        <Card class="status-card">
          <div class="card-content" in:fly={{ y: 20, duration: 200, delay: 200 }}>
            <div class="card-header">
              <span class="material-icons">storage</span>
              <h3>Database Status</h3>
            </div>
            <div class="status-indicator {healthStatus.database.status}">
              <span class="material-icons">
                {healthStatus.database.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.database.status.toUpperCase()}</p>
            </div>
            <p class="service-name">{healthStatus.database.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.database.timestamp).toLocaleString()}
            </p>
          </div>
        </Card>
      {/if}
    </div>
  </div>
</main>

<style>
  .health-status {
    padding: var(--spacing-lg) 0;
  }

  .main-content {
    background: var(--color-white);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-sm);
  }

  .header {
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: var(--font-size-2xl);
    color: var(--color-primary);
    margin-bottom: var(--spacing-sm);
    text-transform: uppercase;
  }

  .subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-light);
    margin-bottom: var(--spacing-lg);
  }

  .actions {
    margin-bottom: var(--spacing-xl);
    display: flex;
    justify-content: flex-end;
  }

  .actions :global(.mdc-button) {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: var(--color-tertiary);
    color: var(--color-white);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--border-radius-sm);
    transition: background-color 0.2s;
  }

  .actions :global(.mdc-button:hover) {
    background-color: var(--color-tertiary-dark);
  }

  .actions :global(.mdc-button:disabled) {
    background-color: var(--color-text-light);
    opacity: 0.7;
  }

  .error-message {
    background-color: var(--color-error);
    color: var(--color-white);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-sm);
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  .status-card {
    background: var(--color-white);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .status-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card-content {
    padding: var(--spacing-lg);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .card-header h3 {
    font-size: var(--font-size-lg);
    color: var(--color-text);
    margin: 0;
    text-transform: uppercase;
  }

  .card-header .material-icons {
    color: var(--color-tertiary);
    font-size: 24px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius-sm);
  }

  .status-indicator.healthy {
    background-color: var(--color-success);
    color: var(--color-white);
  }

  .status-indicator.unhealthy {
    background-color: var(--color-error);
    color: var(--color-white);
  }

  .status-indicator .material-icons {
    font-size: 20px;
  }

  .status-text {
    font-weight: 500;
    margin: 0;
  }

  .service-name {
    color: var(--color-text-light);
    margin-bottom: var(--spacing-xs);
  }

  .timestamp {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    margin: 0;
  }

  @media (max-width: 768px) {
    .main-content {
      padding: var(--spacing-lg);
    }

    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 