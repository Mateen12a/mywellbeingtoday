const API_BASE = import.meta.env.VITE_API_URL || '';
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

let healthCheckTimer: number | null = null;
let isBackendHealthy = true;

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      isBackendHealthy = data.status === 'healthy';
      console.log(`[Health Check] Backend is ${isBackendHealthy ? 'healthy' : 'unhealthy'}`);
      return isBackendHealthy;
    }
    
    isBackendHealthy = false;
    console.warn('[Health Check] Backend returned non-OK status');
    return false;
  } catch (error) {
    isBackendHealthy = false;
    console.warn('[Health Check] Failed to reach backend:', error);
    return false;
  }
}

export function startHealthCheck(): void {
  if (healthCheckTimer) {
    return;
  }
  
  checkBackendHealth();
  
  healthCheckTimer = window.setInterval(() => {
    checkBackendHealth();
  }, HEALTH_CHECK_INTERVAL);
  
  console.log('[Health Check] Started background health monitoring (every 5 minutes)');
}

export function stopHealthCheck(): void {
  if (healthCheckTimer) {
    window.clearInterval(healthCheckTimer);
    healthCheckTimer = null;
    console.log('[Health Check] Stopped background health monitoring');
  }
}

export function getBackendHealthStatus(): boolean {
  return isBackendHealthy;
}
