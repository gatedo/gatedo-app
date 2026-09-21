import api from './api';

export async function fetchAdminVentures() {
  const response = await api.get('/admin/intelligence/ventures');
  return response.data || [];
}

export async function syncAdminVentures(items) {
  const response = await api.post('/admin/intelligence/ventures/bulk', { items });
  return response.data || [];
}

export async function patchAdminVenture(id, patch) {
  const response = await api.patch(`/admin/intelligence/ventures/${id}`, patch);
  return response.data;
}

export async function fetchAdminCampaigns() {
  const response = await api.get('/admin/intelligence/campaigns');
  return response.data || [];
}

export async function syncAdminCampaigns(items) {
  const response = await api.post('/admin/intelligence/campaigns/bulk', { items });
  return response.data || [];
}

export async function patchAdminCampaign(id, patch) {
  const response = await api.patch(`/admin/intelligence/campaigns/${id}`, patch);
  return response.data;
}
