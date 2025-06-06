<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@smui/button';
  import Card from '@smui/card';

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

<div class="health-status">
  <Card>
    <div class="header">
      <h2>System Health Status</h2>
      <Button
        variant="raised"
        color="primary"
        on:click={checkHealth}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Refresh Status'}
      </Button>
    </div>

    {#if error}
      <div class="error">
        <p>Error: {error}</p>
      </div>
    {:else}
      <div class="status-grid">
        {#if healthStatus.system}
          <div class="status-card">
            <h3>System Status</h3>
            <p class="status {healthStatus.system.status}">
              {healthStatus.system.status.toUpperCase()}
            </p>
            <p class="service-name">{healthStatus.system.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.system.timestamp).toLocaleString()}
            </p>
          </div>
        {/if}

        {#if healthStatus.api}
          <div class="status-card">
            <h3>API Status</h3>
            <p class="status {healthStatus.api.status}">
              {healthStatus.api.status.toUpperCase()}
            </p>
            <p class="service-name">{healthStatus.api.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.api.timestamp).toLocaleString()}
            </p>
          </div>
        {/if}

        {#if healthStatus.database}
          <div class="status-card">
            <h3>Database Status</h3>
            <p class="status {healthStatus.database.status}">
              {healthStatus.database.status.toUpperCase()}
            </p>
            <p class="service-name">{healthStatus.database.service}</p>
            <p class="timestamp">
              Last updated: {new Date(healthStatus.database.timestamp).toLocaleString()}
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </Card>
</div>

<style>
  .health-status {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .status-card {
    padding: 1rem;
    border-radius: 4px;
    background-color: #f5f5f5;
  }

  .status {
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
  }

  .status.healthy {
    background-color: #4caf50;
    color: white;
  }

  .status.unhealthy {
    background-color: #f44336;
    color: white;
  }

  .service-name {
    font-weight: 500;
    margin: 0.5rem 0;
  }

  .error {
    color: #f44336;
    padding: 1rem;
    background-color: #ffebee;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .timestamp {
    color: #666;
    font-size: 0.9rem;
  }
</style> 