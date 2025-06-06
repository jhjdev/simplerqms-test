<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@smui/button';
  import Card from '@smui/card';

  interface ServiceStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    service: string;
  }

  let healthStatus: ServiceStatus | null = null;
  let loading = true;
  let error: string | null = null;
  let lastCheck = new Date();

  async function checkHealth() {
    try {
      loading = true;
      error = null;
      
      console.log('Fetching health status...');
      const response = await fetch('/health');
      console.log('Health check response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Health check data:', data);
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid health check response');
      }

      healthStatus = {
        status: data.status || 'unhealthy',
        timestamp: data.timestamp || new Date().toISOString(),
        service: data.service || 'unknown'
      };
      
      console.log('Processed health status:', healthStatus);
      lastCheck = new Date();
    } catch (e) {
      console.error('Health check error:', e);
      error = e instanceof Error ? e.message : 'Failed to check health status';
      healthStatus = null;
    } finally {
      loading = false;
    }
  }

  function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  onMount(() => {
    checkHealth();
  });
</script>

<div class="health-check">
  <Card>
    <div class="header">
      <h2>System Health Dashboard</h2>
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
    {:else if healthStatus}
      <div class="status-grid">
        <!-- Frontend Status -->
        <div class="status-card">
          <h3>Frontend Status</h3>
          <p class="status ok">
            OK
          </p>
          <p class="service-name">Svelte Application</p>
          <p class="timestamp">
            Last updated: {lastCheck.toLocaleString()}
          </p>
        </div>

        <!-- API Status -->
        <div class="status-card">
          <h3>API Status</h3>
          <p class="status {healthStatus.status === 'healthy' ? 'ok' : 'error'}">
            {healthStatus.status.toUpperCase()}
          </p>
          <p class="service-name">{healthStatus.service}</p>
          <p class="timestamp">
            Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
          </p>
        </div>

        <!-- Database Status -->
        <div class="status-card">
          <h3>Database Status</h3>
          <p class="status {healthStatus.status === 'healthy' ? 'ok' : 'error'}">
            {healthStatus.status.toUpperCase()}
          </p>
          <p class="service-name">PostgreSQL</p>
          <p class="timestamp">
            Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      <div class="overall-status">
        <h3>Overall System Status</h3>
        <p class="status {healthStatus.status === 'healthy' ? 'ok' : 'error'}">
          {healthStatus.status.toUpperCase()}
        </p>
        <p class="timestamp">
          Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
        </p>
      </div>
    {:else}
      <p>No status information available</p>
    {/if}
  </Card>
</div>

<style>
  .health-check {
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

  .status.ok {
    background-color: #4caf50;
    color: white;
  }

  .status.error {
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

  .overall-status {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    text-align: center;
  }

  .overall-status h3 {
    margin: 0 0 0.5rem 0;
  }

  .overall-status .status {
    font-size: 1.2rem;
    padding: 0.5rem 1rem;
  }
</style> 