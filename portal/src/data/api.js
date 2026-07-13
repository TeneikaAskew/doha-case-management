const cache = new Map();

export async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);
  const url = `${import.meta.env.BASE_URL}data/${path}`;
  // no-store: demo data regenerates often; never serve a stale HTTP-cached copy
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export const getSubjects = () => fetchJson('subjects.json').then((d) => d.subjects);
export const getStaff = () => fetchJson('staff.json').then((d) => d.staff);
export const getCase = (id) => fetchJson(`cases/${id}.json`);
export const getAlerts = () => fetchJson('alerts.json').then((d) => d.alerts);
export const getProviders = () => fetchJson('providers.json').then((d) => d.providers);
export const getAnalytics = () => fetchJson('analytics.json');
export const getProviderActivity = () =>
  fetchJson('provider-activity.json').then((d) => d.providers);
