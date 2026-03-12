import api from './index';

export const getSettingsApi = async () => {
    return await api.get('/api/admin/settings');
};

export const updateSettingsApi = async (data) => {
    return await api.post('/api/admin/settings', data);
};
