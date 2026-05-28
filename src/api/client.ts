const BASE_URL = '/api';

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // 自动附加认证 token（backend 通过 Query 参数校验）
  const token = getToken();
  const separator = path.includes('?') ? '&' : '?';
  const authPath = token ? `${path}${separator}token=${encodeURIComponent(token)}` : path;
  
  const res = await fetch(`${BASE_URL}${authPath}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ═══ Dashboard ═══
export interface DashboardOverview {
  total_stores: number;
  total_malls: number;
  today_alerts: number;
  today_indicator: number;
  today_model: number;
  today_critical: number;
  today_warning: number;
  today_minor: number;
  today_alerted_stores: number;
  indicator: { total: number; critical: number; warning: number; pending: number };
  model: { total: number; critical: number; warning: number };
  model_distribution: { model_type: string; count: number; critical: number; warning: number }[];
  alert_trend: { date: string; indicator: number; model: number; total: number }[];
  indicator_types: { type: string; count: number }[];
  indicator_distribution: { type: string; count: number }[];
  indicator_detail: any[];
  model_detail: any[];
}

export const dashboardApi = {
  overview: (params?: string) => api.get<DashboardOverview>(`/dashboard/overview${params ? '?'+params : ''}`),
  cityHeatmap: () => api.get<any[]>('/dashboard/city-heatmap'),
};

// ═══ Diagnosis ═══
export interface BostonPoint {
  x: number; y: number;
  store_name: string; store_id: string;
  city: string; quadrant: string; deviation: number; flow: number;
}

export const diagnosisApi = {
  bostonMatrix: (params?: { calc_date?: string; city?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<BostonPoint[]>(`/diagnosis/boston-matrix?${qs}`);
  },
  deviationRanking: (sort_order?: string, limit?: number, calc_date?: string) => {
    const qs = new URLSearchParams({ sort_order: sort_order || 'asc', limit: String(limit || 20), ...(calc_date ? { calc_date } : {}) }).toString();
    return api.get<any[]>(`/diagnosis/deviation-ranking?${qs}`);
  },
  indexTrend: (params?: { store_id?: string; city?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<any>(`/diagnosis/index-trend?${qs}`);
  },
  anomalyStores: () => api.get<any[]>('/diagnosis/anomaly-stores'),
};

// ═══ Stores ═══
export const storeApi = {
  list: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<any>(`/stores?${qs}`);
  },
  detail: (storeId: string) => api.get<any>(`/stores/${storeId}`),
};

// ═══ Alerts ═══
export const alertApi = {
  list: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get<any>(`/alerts?${qs}`);
  },
  handle: (alertId: number, note: string) =>
    api.put(`/alerts/${alertId}/handle`, { note }),
  rules: () => api.get<any[]>('/alert-rules'),
  createRule: (body: any) => api.post('/alert-rules', body),
  updateRule: (ruleId: number, body: any) => api.put(`/alert-rules/${ruleId}`, body),
};

// ═══ Districts ═══
export const districtApi = {
  list: (city?: string) => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    return api.get<any[]>(`/districts${qs}`);
  },
  compare: (districtIds?: string) => {
    const qs = districtIds ? `?district_ids=${districtIds}` : '';
    return api.get<any[]>(`/districts/compare${qs}`);
  },
  stores: (districtId: number, sortBy?: string) => {
    const qs = new URLSearchParams({ sort_by: sortBy || 'index' }).toString();
    return api.get<any[]>(`/districts/${districtId}/stores?${qs}`);
  },
};

// ═══ Meta ═══
export const metaApi = {
  cities: () => api.get<any[]>('/meta/cities'),
  districtsByCity: (city: string) => api.get<any[]>(`/meta/districts-by-city?city=${encodeURIComponent(city)}`),
};

// ═══ Reports ═══
export const reportApi = {
  dailySummary: (date?: string) => {
    const qs = date ? `?report_date=${date}` : '';
    return api.get<any>(`/reports/daily-summary${qs}`);
  },
};

// ═══ Admin ═══
export const adminApi = {
  users: () => api.get<any[]>('/admin/users'),
  roles: () => api.get<any[]>('/admin/roles'),
  permissions: () => api.get<any[]>('/admin/permissions'),
};
