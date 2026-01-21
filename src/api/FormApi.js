import ApiClient from './ApiClient';

const FORM_ENDPOINT = 'form/';

const FormApi = {
    createForm: async (data) => {
        return ApiClient.post(FORM_ENDPOINT, data);
    },
    getForm: async (id) => {
        return ApiClient.get(`${FORM_ENDPOINT}${id}/`);
    },
    updateForm: async (id, data) => {
        return ApiClient.put(`${FORM_ENDPOINT}${id}/`, data);
    },
    deleteForm: async (id) => {
        return ApiClient.delete(`${FORM_ENDPOINT}${id}/`);
    },
    listForms: async () => {
        return ApiClient.get(FORM_ENDPOINT);
    }
};

export default FormApi;
