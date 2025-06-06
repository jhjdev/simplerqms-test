<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '@smui/button';
  import Card from '@smui/card';
  import { fade, fly } from 'svelte/transition';
  import '../styles/HealthCheck.css';
  import { ANIMATION_CONFIG } from '../config/animations';

  interface MemoryInfo {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    heapUsedPercentage: number;
  }

  interface CpuInfo {
    user: number;
    system: number;
  }

  interface DatabaseStatistics {
    tables: number;
    totalInserts: number;
    totalUpdates: number;
    totalDeletes: number;
  }

  interface RequestInfo {
    total: number;
    today: number;
    errors4xx: number;
    errors5xx: number;
    errorRate: string;
  }

  interface DockerInfo {
    containerId?: string;
    cpuPercentage?: string;
    memoryUsage?: string;
    networkIO?: string;
    status?: string;
  }

  interface RecentActivity {
    lastUserCreated: {
      name: string;
      createdAt: string;
    } | null;
    lastGroupModified: {
      name: string;
      modifiedAt: string;
    } | null;
  }

  interface ServiceInfo {
    status: 'healthy' | 'unhealthy';
    uptime?: number;
    uptimeFormatted?: string;
    memory?: MemoryInfo;
    cpu?: CpuInfo;
    responseTime?: string;
    name?: string;
    version?: string;
    connectionCount?: number;
    activeConnections?: number;
    size?: string;
    statistics?: DatabaseStatistics;
    requests?: RequestInfo;
    error?: string;
  }

  interface DataCounts {
    users: number;
    groups: number;
    memberships: number;
  }

  interface EnvironmentInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    environment: string;
    pid: number;
    timezone: string;
  }

  interface VersionInfo {
    api: string;
    node: string;
  }

  interface PerformancePoint {
    timestamp: string;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  }

  interface PerformanceData {
    history: PerformancePoint[];
    current: {
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
  }

  interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }

  interface AlertData {
    recent: Alert[];
    summary: {
      total: number;
      unresolved: number;
      lastAlert: string | null;
    };
  }

  interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    service: string;
    responseTime: string;
    services: {
      api: ServiceInfo;
      database: ServiceInfo;
    };
    data: DataCounts;
    recentActivity: RecentActivity;
    docker: DockerInfo;
    environment: EnvironmentInfo;
    version: VersionInfo;
    performance: PerformanceData;
    alerts: AlertData;
    error?: string;
  }

  let healthStatus: HealthResponse | null = null;
  let loading = true;
  let error: string | null = null;
  let lastCheck = new Date();
  let autoRefresh = true;
  let refreshInterval: number;

  async function checkHealth() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      healthStatus = await response.json();
      lastCheck = new Date();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to check health status';
    } finally {
      loading = false;
    }
  }

  function startAutoRefresh() {
    if (autoRefresh) {
      refreshInterval = setInterval(checkHealth, ANIMATION_CONFIG.refreshInterval);
    }
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  function exportHealthData() {
    if (healthStatus) {
      const dataStr = JSON.stringify(healthStatus, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  onMount(() => {
    checkHealth();
    startAutoRefresh();
  });

  onDestroy(() => {
    stopAutoRefresh();
  });
</script>

<main class="health-status">
  <div class="main-content">
    <div class="header">
      <h1>🚀 System Health Dashboard</h1>
      <h3>Comprehensive monitoring of all system components</h3>
    </div>

    <div class="actions">
      <Button
        variant="raised"
        on:click={checkHealth}
        disabled={loading}
        class="mdc-button--raised"
        style="background-color: var(--color-tertiary); color: white;"
      >
        <span class="material-icons">refresh</span>
        {loading ? 'Checking...' : 'Refresh Status'}
      </Button>
      
      <Button
        variant="outlined"
        on:click={toggleAutoRefresh}
        class="mdc-button--outlined"
        style="color: var(--color-tertiary);"
      >
        <span class="material-icons">
          {autoRefresh ? 'pause' : 'play_arrow'}
        </span>
        {autoRefresh ? 'Pause Auto-refresh' : 'Enable Auto-refresh'}
      </Button>
      
      {#if healthStatus}
        <Button
          variant="outlined"
          on:click={exportHealthData}
          class="mdc-button--outlined"
          style="color: var(--color-tertiary);"
        >
          <span class="material-icons">download</span>
          Export Report
        </Button>
      {/if}
    </div>

    {#if error}
      <div class="error-message" in:fade={{ duration: ANIMATION_CONFIG.durations.fade }}>
        <span class="material-icons">error</span>
        <p>{error}</p>
      </div>
    {/if}

    {#if loading}
      <div class="loading" in:fade={{ duration: ANIMATION_CONFIG.durations.fade }}>
        <div class="spinner"></div>
        <p>Checking system health...</p>
      </div>
    {/if}

    {#if healthStatus}
      <!-- Overall Status Summary -->
      <div class="overall-status" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.default, delay: ANIMATION_CONFIG.delays.overallStatus }}>
        <Card class="summary-card">
          <div class="summary-content">
            <div class="status-indicator {healthStatus.status}">
              <span class="material-icons">
                {healthStatus.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <h2>System Status: {healthStatus.status.toUpperCase()}</h2>
            </div>
            <div class="summary-stats">
              <div class="stat">
                <span class="material-icons">speed</span>
                <span>Response: {healthStatus.responseTime}</span>
              </div>
              <div class="stat">
                <span class="material-icons">update</span>
                <span>Last Check: {lastCheck.toLocaleString()}</span>
              </div>
              {#if autoRefresh}
                <div class="stat auto-refresh">
                  <span class="material-icons">autorenew</span>
                  <span>Auto-refresh: ON</span>
                </div>
              {/if}
            </div>
          </div>
        </Card>
      </div>

      <!-- Service Status Grid -->
      <div class="status-grid">
        <!-- Frontend Status -->
        <Card class="status-card frontend">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.frontend }}>
            <div class="card-header">
              <span class="material-icons">web</span>
              <h3>Frontend</h3>
            </div>
            <div class="status-indicator {healthStatus.status}">
              <span class="material-icons">
                {healthStatus.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.status.toUpperCase()}</p>
            </div>
            <div class="service-details">
              <p class="service-name">Svelte Application</p>
              <p class="detail">🎨 UI Framework: Svelte + TypeScript</p>
              <p class="detail">📦 Build Tool: Vite</p>
              <p class="detail">🌐 Status: {healthStatus.status === 'healthy' ? 'Running & Responsive' : 'Issues Detected'}</p>
            </div>
          </div>
        </Card>

        <!-- API Status -->
        <Card class="status-card api">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.api }}>
            <div class="card-header">
              <span class="material-icons">api</span>
              <h3>API Server</h3>
            </div>
            <div class="status-indicator {healthStatus.services.api.status}">
              <span class="material-icons">
                {healthStatus.services.api.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.services.api.status.toUpperCase()}</p>
            </div>
            <div class="service-details">
              <p class="service-name">{healthStatus.service}</p>
              {#if healthStatus.services.api.uptimeFormatted}
                <p class="detail">⏱️ Uptime: {healthStatus.services.api.uptimeFormatted}</p>
              {/if}
              {#if healthStatus.services.api.memory}
                <p class="detail">💾 Memory: {healthStatus.services.api.memory.heapUsed} / {healthStatus.services.api.memory.heapTotal} ({healthStatus.services.api.memory.heapUsedPercentage}%)</p>
              {/if}
              {#if healthStatus.version}
                <p class="detail">🏷️ Version: {healthStatus.version.api}</p>
              {/if}
            </div>
          </div>
        </Card>

        <!-- Database Status -->
        <Card class="status-card database">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.database }}>
            <div class="card-header">
              <span class="material-icons">storage</span>
              <h3>Database</h3>
            </div>
            <div class="status-indicator {healthStatus.services.database.status}">
              <span class="material-icons">
                {healthStatus.services.database.status === 'healthy' ? 'check_circle' : 'error'}
              </span>
              <p class="status-text">{healthStatus.services.database.status.toUpperCase()}</p>
            </div>
            <div class="service-details">
              {#if healthStatus.services.database.name}
                <p class="service-name">{healthStatus.services.database.name}</p>
              {/if}
              {#if healthStatus.services.database.version}
                <p class="detail">🏷️ Version: {healthStatus.services.database.version}</p>
              {/if}
              {#if healthStatus.services.database.responseTime}
                <p class="detail">⚡ Response: {healthStatus.services.database.responseTime}</p>
              {/if}
              {#if healthStatus.services.database.statistics}
                <p class="detail">📊 Tables: {healthStatus.services.database.statistics.tables}</p>
              {/if}
            </div>
          </div>
        </Card>
      </div>

      <!-- Data & Performance Metrics -->
      <div class="metrics-grid">
        <!-- Application Data -->
        <Card class="metric-card">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.applicationData }}>
            <div class="card-header">
              <span class="material-icons">data_usage</span>
              <h3>Application Data</h3>
            </div>
            <div class="metrics">
              <div class="metric">
                <span class="value">{healthStatus.data.users}</span>
                <span class="label">Users</span>
              </div>
              <div class="metric">
                <span class="value">{healthStatus.data.groups}</span>
                <span class="label">Groups</span>
              </div>
              <div class="metric">
                <span class="value">{healthStatus.data.memberships}</span>
                <span class="label">Memberships</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Performance Metrics -->
        {#if healthStatus.services.api.memory}
          <Card class="metric-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.memoryUsage }}>
              <div class="card-header">
                <span class="material-icons">memory</span>
                <h3>Memory Usage</h3>
              </div>
              <div class="memory-info">
                <div class="memory-bar">
                  <div class="memory-used" style="width: {healthStatus.services.api.memory.heapUsedPercentage}%"></div>
                </div>
                <p>Heap: {healthStatus.services.api.memory.heapUsed} / {healthStatus.services.api.memory.heapTotal}</p>
                <p>RSS: {healthStatus.services.api.memory.rss}</p>
                <p>External: {healthStatus.services.api.memory.external}</p>
              </div>
            </div>
          </Card>
        {/if}

        <!-- Environment Info -->
        <Card class="metric-card">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.environment }}>
            <div class="card-header">
              <span class="material-icons">settings</span>
              <h3>Environment</h3>
            </div>
            <div class="env-info">
              <p>🌍 Environment: {healthStatus.environment.environment}</p>
              <p>🖥️ Platform: {healthStatus.environment.platform} ({healthStatus.environment.arch})</p>
              <p>🟢 Node.js: {healthStatus.environment.nodeVersion}</p>
              <p>🔗 PID: {healthStatus.environment.pid}</p>
              <p>🕐 Timezone: {healthStatus.environment.timezone}</p>
            </div>
          </div>
        </Card>

        <!-- Request Statistics -->
        {#if healthStatus.services.api.requests}
          <Card class="metric-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.apiTraffic }}>
              <div class="card-header">
                <span class="material-icons">traffic</span>
                <h3>API Traffic</h3>
              </div>
              <div class="metrics">
                <div class="metric">
                  <span class="value">{healthStatus.services.api.requests.total.toLocaleString()}</span>
                  <span class="label">Total Requests</span>
                </div>
                <div class="metric">
                  <span class="value">{healthStatus.services.api.requests.today.toLocaleString()}</span>
                  <span class="label">Today</span>
                </div>
                <div class="metric">
                  <span class="value error-rate">{healthStatus.services.api.requests.errorRate}</span>
                  <span class="label">Error Rate</span>
                </div>
              </div>
              <div class="error-breakdown">
                <div class="error-stat">
                  <span>4xx Errors: {healthStatus.services.api.requests.errors4xx}</span>
                </div>
                <div class="error-stat">
                  <span>5xx Errors: {healthStatus.services.api.requests.errors5xx}</span>
                </div>
              </div>
            </div>
          </Card>
        {/if}

        <!-- Database Details -->
        {#if healthStatus.services.database.size}
          <Card class="metric-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.databaseDetails }}>
              <div class="card-header">
                <span class="material-icons">storage</span>
                <h3>Database Details</h3>
              </div>
              <div class="db-details">
                <div class="stat-row">
                  <span class="stat-label">Database Size:</span>
                  <span class="stat-value">{healthStatus.services.database.size}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Active Connections:</span>
                  <span class="stat-value">{healthStatus.services.database.activeConnections}</span>
                </div>
                {#if healthStatus.services.database.statistics}
                  <div class="stat-row">
                    <span class="stat-label">Total Operations:</span>
                    <span class="stat-value">{(healthStatus.services.database.statistics.totalInserts + healthStatus.services.database.statistics.totalUpdates + healthStatus.services.database.statistics.totalDeletes).toLocaleString()}</span>
                  </div>
                {/if}
              </div>
            </div>
          </Card>
        {/if}

        <!-- Recent Activity -->
        <Card class="metric-card">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.recentActivity }}>
            <div class="card-header">
              <span class="material-icons">history</span>
              <h3>Recent Activity</h3>
            </div>
            <div class="activity-info">
              {#if healthStatus.recentActivity.lastUserCreated}
                <div class="activity-item">
                  <span class="activity-icon">👤</span>
                  <div class="activity-details">
                    <p class="activity-title">Last User Created</p>
                    <p class="activity-value">{healthStatus.recentActivity.lastUserCreated.name}</p>
                    <p class="activity-time">{new Date(healthStatus.recentActivity.lastUserCreated.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              {:else}
                <div class="activity-item">
                  <span class="activity-icon">👤</span>
                  <div class="activity-details">
                    <p class="activity-title">Last User Created</p>
                    <p class="activity-value">No users yet</p>
                  </div>
                </div>
              {/if}

              {#if healthStatus.recentActivity.lastGroupModified}
                <div class="activity-item">
                  <span class="activity-icon">👥</span>
                  <div class="activity-details">
                    <p class="activity-title">Last Group Modified</p>
                    <p class="activity-value">{healthStatus.recentActivity.lastGroupModified.name}</p>
                    <p class="activity-time">{new Date(healthStatus.recentActivity.lastGroupModified.modifiedAt).toLocaleString()}</p>
                  </div>
                </div>
              {:else}
                <div class="activity-item">
                  <span class="activity-icon">👥</span>
                  <div class="activity-details">
                    <p class="activity-title">Last Group Modified</p>
                    <p class="activity-value">No groups modified yet</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </Card>

        <!-- Docker Information -->
        {#if healthStatus.docker && !healthStatus.docker.status}
          <Card class="metric-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.docker }}>
              <div class="card-header">
                <span class="material-icons">container</span>
                <h3>Docker Container</h3>
              </div>
              <div class="docker-info">
                <div class="stat-row">
                  <span class="stat-label">Container ID:</span>
                  <span class="stat-value">{healthStatus.docker.containerId?.substring(0, 12) || 'N/A'}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">CPU Usage:</span>
                  <span class="stat-value">{healthStatus.docker.cpuPercentage || 'N/A'}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Memory Usage:</span>
                  <span class="stat-value">{healthStatus.docker.memoryUsage || 'N/A'}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Network I/O:</span>
                  <span class="stat-value">{healthStatus.docker.networkIO || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>
        {/if}

        <!-- Performance Sparklines -->
        {#if healthStatus.performance && healthStatus.performance.history.length > 0}
          <Card class="metric-card sparkline-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.performance }}>
              <div class="card-header">
                <span class="material-icons">show_chart</span>
                <h3>Performance Trends</h3>
              </div>
              <div class="sparklines">
                <div class="sparkline-group">
                  <div class="sparkline-header">
                    <span class="sparkline-title">Response Time</span>
                    <span class="sparkline-value">{healthStatus.performance.current.responseTime}ms</span>
                  </div>
                  <div class="sparkline" data-values="{healthStatus.performance.history.map(p => p.responseTime).join(',')}">
                    <svg viewBox="0 0 200 40" class="sparkline-svg">
                      {#each healthStatus.performance.history as point, i}
                        {#if i > 0}
                          <line 
                            x1={((i-1) / (healthStatus.performance.history.length-1)) * 200} 
                            y1={40 - (healthStatus.performance.history[i-1].responseTime / Math.max(...healthStatus.performance.history.map(p => p.responseTime)) * 30)}
                            x2={(i / (healthStatus.performance.history.length-1)) * 200} 
                            y2={40 - (point.responseTime / Math.max(...healthStatus.performance.history.map(p => p.responseTime)) * 30)}
                            stroke="#4ecdc4" 
                            stroke-width="2" 
                            fill="none"
                          />
                        {/if}
                      {/each}
                    </svg>
                  </div>
                </div>
                
                <div class="sparkline-group">
                  <div class="sparkline-header">
                    <span class="sparkline-title">Memory Usage</span>
                    <span class="sparkline-value">{healthStatus.performance.current.memoryUsage}%</span>
                  </div>
                  <div class="sparkline">
                    <svg viewBox="0 0 200 40" class="sparkline-svg">
                      {#each healthStatus.performance.history as point, i}
                        {#if i > 0}
                          <line 
                            x1={((i-1) / (healthStatus.performance.history.length-1)) * 200} 
                            y1={40 - (healthStatus.performance.history[i-1].memoryUsage / 100 * 30)}
                            x2={(i / (healthStatus.performance.history.length-1)) * 200} 
                            y2={40 - (point.memoryUsage / 100 * 30)}
                            stroke="#ff6b6b" 
                            stroke-width="2" 
                            fill="none"
                          />
                        {/if}
                      {/each}
                    </svg>
                  </div>
                </div>
                
                <div class="sparkline-group">
                  <div class="sparkline-header">
                    <span class="sparkline-title">Database Connections</span>
                    <span class="sparkline-value">{healthStatus.performance.current.activeConnections}</span>
                  </div>
                  <div class="sparkline">
                    <svg viewBox="0 0 200 40" class="sparkline-svg">
                      {#each healthStatus.performance.history as point, i}
                        {#if i > 0}
                          <line 
                            x1={((i-1) / (healthStatus.performance.history.length-1)) * 200} 
                            y1={40 - (healthStatus.performance.history[i-1].activeConnections / Math.max(...healthStatus.performance.history.map(p => p.activeConnections)) * 30)}
                            x2={(i / (healthStatus.performance.history.length-1)) * 200} 
                            y2={40 - (point.activeConnections / Math.max(...healthStatus.performance.history.map(p => p.activeConnections)) * 30)}
                            stroke="#45b7d1" 
                            stroke-width="2" 
                            fill="none"
                          />
                        {/if}
                      {/each}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        {/if}

        <!-- Alert History -->
        <Card class="metric-card alert-card">
          <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.alerts }}>
            <div class="card-header">
              <span class="material-icons">notifications</span>
              <h3>Alert History</h3>
            </div>
            
            <div class="alert-summary">
              <div class="alert-stat">
                <span class="alert-count">{healthStatus.alerts?.summary.total || 0}</span>
                <span class="alert-label">Total Alerts</span>
              </div>
              <div class="alert-stat">
                <span class="alert-count unresolved">{healthStatus.alerts?.summary.unresolved || 0}</span>
                <span class="alert-label">Unresolved</span>
              </div>
              {#if healthStatus.alerts?.summary.lastAlert}
                <div class="alert-stat">
                  <span class="alert-time">{new Date(healthStatus.alerts.summary.lastAlert).toLocaleString()}</span>
                  <span class="alert-label">Last Alert</span>
                </div>
              {/if}
            </div>
            
            {#if healthStatus.alerts?.recent && healthStatus.alerts.recent.length > 0}
              <div class="alert-list">
                {#each healthStatus.alerts.recent as alert}
                  <div class="alert-item {alert.type}" class:resolved={alert.resolved}>
                    <div class="alert-icon">
                      <span class="material-icons">
                        {alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
                      </span>
                    </div>
                    <div class="alert-content">
                      <p class="alert-message">{alert.message}</p>
                      <p class="alert-timestamp">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="alert-status">
                      {#if alert.resolved}
                        <span class="material-icons resolved-icon">check_circle</span>
                      {:else}
                        <span class="material-icons pending-icon">pending</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-alerts">
                <span class="material-icons">check_circle</span>
                <p>No alerts - System running smoothly! 🎉</p>
              </div>
            {/if}
          </div>
        </Card>

        <!-- Database Statistics -->
        {#if healthStatus.services.database.statistics}
          <Card class="metric-card">
            <div class="card-content" in:fly={{ y: 20, duration: ANIMATION_CONFIG.durations.fly.card, delay: ANIMATION_CONFIG.delays.databaseStats }}>
              <div class="card-header">
                <span class="material-icons">analytics</span>
                <h3>Database Activity</h3>
              </div>
              <div class="db-stats">
                <div class="stat-row">
                  <span class="stat-label">Total Inserts:</span>
                  <span class="stat-value">{healthStatus.services.database.statistics.totalInserts.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Total Updates:</span>
                  <span class="stat-value">{healthStatus.services.database.statistics.totalUpdates.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Total Deletes:</span>
                  <span class="stat-value">{healthStatus.services.database.statistics.totalDeletes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        {/if}
      </div>
    {/if}
  </div>
</main>

