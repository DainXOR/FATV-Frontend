import ApiClient from './ApiClient';

const SUPPORT_ENDPOINT = 'support/';

const SupportApi = {
    createSupport: async (data) => {
        return ApiClient.post(SUPPORT_ENDPOINT, data);
    },
    getSupport: async (id) => {
        return ApiClient.get(`${SUPPORT_ENDPOINT}${id}/`);
    },
    updateSupport: async (id, data) => {
        return ApiClient.put(`${SUPPORT_ENDPOINT}${id}/`, data);
    },
    deleteSupport: async (id) => {
        return ApiClient.delete(`${SUPPORT_ENDPOINT}${id}/`);
    },
    listSupports: async () => {
        return ApiClient.get(SUPPORT_ENDPOINT);
    }
};

export default SupportApi;
