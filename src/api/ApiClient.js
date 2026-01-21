import axios from 'axios';

const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

class ApiClient {
    constructor() {
        this.client = axios.create({
            baseURL: `${BASE_URL}/api/${API_VERSION}/`,
        });
    }

    setAuthToken(token) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    async get(url, config = {}) {
        return this.client.get(url, config);
    }

    async post(url, data, config = {}) {
        return this.client.post(url, data, config);
    }

    async put(url, data, config = {}) {
        return this.client.put(url, data, config);
    }

    async delete(url, config = {}) {
        return this.client.delete(url, config);
    }
}

export default new ApiClient();
