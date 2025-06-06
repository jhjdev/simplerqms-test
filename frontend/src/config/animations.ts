export const ANIMATION_CONFIG = {
  // Health check refresh interval in milliseconds
  refreshInterval: 30000,
  
  // Animation durations in milliseconds
  durations: {
    fade: 200,
    fly: {
      default: 300,
      card: 200
    }
  },
  
  // Animation delays in milliseconds
  delays: {
    overallStatus: 0,
    frontend: 0,
    api: 100,
    database: 200,
    applicationData: 300,
    memoryUsage: 400,
    environment: 500,
    apiTraffic: 500,
    databaseDetails: 600,
    recentActivity: 700,
    docker: 800,
    performance: 800,
    alerts: 900,
    databaseStats: 1000
  }
} as const; 