import axios from 'axios';
import { config } from "../utils/config.js";

export class Api {
    /**
     * @type {string}
     */
    #apiUrl;
    /**
     * @type {string | null}
     */
    #forceRouteVersion;
    /**
     * @type {string}
     */
    #routeVersion
    /**
     * @type {import("axios").AxiosInstance | null}
     */
    #client;
    /**
     * @type {string | null}
     */
    #token;

    constructor({
        apiUrl = config.backendUrl + "/api",
        defaultRouteVersion = config.apiRouteVersion,
        token = null
    } = {}) {
        this.#apiUrl = apiUrl;
        this.#forceRouteVersion = defaultRouteVersion;
        this.#routeVersion = '';
        this.#client = null;
        this.#token = token;
    }

    /**
     * Checks whether a base URL is reachable
     * @param {string} baseUrl
     * @returns {Promise<boolean>}
     */
    async #checkUrl(baseUrl) {
        try {
            await axios.get(baseUrl, { timeout: 1500 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Fetches the API version from the backend
     * @param {string} baseUrl
     * @param {string} defaultVersion
     * @returns {Promise<string>}
     */
    async #fetchApiVersion(baseUrl, defaultVersion) {
        try {
            const res = await axios.get(
                `${baseUrl}/${config.apiRouteVersionPath}`,
                { timeout: 1500 }
            );
            return res.data?.version ?? defaultVersion;
        } catch {
            return defaultVersion;
        }
    }

    #createClient() {
        this.#client = axios.create({
            baseURL: `${this.#apiUrl}/v${this.#routeVersion}/`,
            timeout: 5000,
        });

        this.#client.interceptors.request.use((config) => {
            const fullURL = `${config.baseURL}${config.url}`;
            console.log(`Request URL: ${config.method?.toUpperCase()} ${fullURL}`);
            console.log(`Request Data: ${config.data}`);

            
            // const token = authStore.getToken();
            if (this.#token) {
                config.headers.Authorization = `Bearer ${this.#token}`;
            }
            

            config.headers["X-Request-ID"] = crypto.randomUUID();

            return config;
        });

        this.#client.interceptors.response.use(
            (response) => {
                console.log(`Response Status: ${response.status} for ${response.config.url}`);
                return response;
            },
            (error) => {
                console.log(`Response Status: ${error.status} for ${error.config.url}`);
                return Promise.reject(error)
            }
        );
    }

    /**
     * @param {string} token
     */
    setToken(token) {
        this.#token = token;
    }
    clearToken() {
        this.#token = null;
    }
    /**
     * @returns {boolean}
     */
    hasToken() {
        return this.#token != null;
    }
    /**
     * @returns {string | null}
     */
    token() {
        return this.#token;
    }
    

    /**
     * Checks and establish connection to the base URL
     * @returns {Promise<boolean>}
     */
    async connect() {
        if (this.#client != null) {
            return true;
        }

        if (!(await this.#checkUrl(`${this.#apiUrl}/${config.apiHealthPath}`))) {
            return false;
        }

        this.#routeVersion = this.#forceRouteVersion ?? await this.#fetchApiVersion(this.#apiUrl, '1');
        
        this.#createClient();
        return true;
    }
    /**
     * Connect using a known API version (no network calls)
     * @param {string} version
     */
    connectWithVersion(version) {
        if (!version) {
            throw new Error("Version cannot be empty");
        }

        this.#routeVersion = version;
        this.#createClient();
        return true;
    }

    disconnect() {
        this.#client = null;
    }

    /**
     * Creates the connection to the base URL but does not check its health.
     * Only use this if you are sure the URL is reachable.
     * @returns {boolean}
     */
    #uncheckedConnect() {
        this.#client = axios.create({ 
            baseURL: `${this.#apiUrl}/v${this.#routeVersion}/`,
            timeout: 5000
        });

        return true;
    }

    /**
     * @returns {import("axios").AxiosInstance}
     */
    #Client() {
        if (this.#client == null) {
            throw new Error('API not connected. Try calling connect() first.');
        }

        return this.#client;
    }

    /**
     * @param {string} version
     * 
     * @returns {Api}
     */
    withVersion(version) {
        if (!version) {
            throw new Error("Version cannot be empty");
        }

        let returnApi = new Api();
        returnApi.#apiUrl = this.#apiUrl;
        returnApi.#forceRouteVersion = version;

        if (!returnApi.#uncheckedConnect()) {
            throw new Error("Could not connect to API with version " + version);
        }

        return returnApi;
    }

    /**
     * @template TBody
     * 
     * @param {string} path 
     * @param {import("../utils/types.js").RequestOptions<TBody>} options
     * @returns {string}
     */
    #buildRequestUrl(path, options) {
        const { pathParams = [] } = options;

        return (
            path +
            (pathParams.length ? '/' + pathParams.map(encodeURIComponent).join('/') : '')
        );
    }

    /**
     * Normalize Axios headers into Record<string, string>
     *
     * - Drops null / undefined values
     * - Joins array values with ", "
     * - Stringifies numbers & booleans
     *
     * @param {import("axios").AxiosResponseHeaders | Partial<Record<string, any>>} headers
     * @returns {Record<string, string>}
     */
    #normalizeAxiosHeaders(headers) {
        /** @type {Record<string, string>} */
        const result = {};

        if (!headers) return result;

        for (const [key, value] of Object.entries(headers)) {
            if (value == null) continue;

            if (Array.isArray(value)) {
                result[key] = value.join(", ");
                continue;
            }

            result[key] = String(value);
        }

        return result;
    }

    /**
     * @template TResponse
     * @template TBody
     * 
     * @param {string} method
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<TBody>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async #request(method, path, options = {}) {
        const {pathParams = [], queryParams = {}, body} = options;
        const fullPath = this.#buildRequestUrl(path, options);

        console.log(`API Request: ${method.toUpperCase()} ${fullPath}`);

        try {
            const response = await this.#Client().request({
                method,
                url: fullPath,
                params: queryParams,
                data: body,
            });

            return {
                ok: true,
                status: response.status,
                body: response.data,
                headers: this.#normalizeAxiosHeaders(response.headers),
                rawHeaders: response.headers
            };

        } catch (error) {
            if (!axios.isAxiosError(error)) {
                const err =
                    error instanceof Error
                        ? error
                        : new Error("Unknown error");

                return {
                    ok: false,
                    status: 0,
                    error: {
                        message: err.message,
                        details: error
                    }
                };
            }

            const status = error.response?.status;

            if (!status) {
                return {
                    ok: false,
                    status: 0,
                    error: {
                        message: error.message,
                        details: error
                    }
                };
            }

            return {
                ok: false,
                status,
                error: {
                    message: error.message,
                    details: error.response?.data
                }
            };
        }
    }

    /**
     * @template TResponse
     * 
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<{}>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async get(path, options = {}) {
        return this.#request('get', path, options);
    }

    /**
     * @template TResponse
     * @template TBody
     * 
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<TBody>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async post(path, options = {}) {
        return this.#request('post', path, options);
    }

    /**
     * @template TResponse
     * @template TBody
     * 
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<TBody>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async put(path, options = {}) {
        return this.#request('put', path, options);
    }

    /**
     * @template TResponse
     * @template TBody
     * 
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<TBody>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async patch(path, options = {}) {
        return this.#request('patch', path, options);
    }

    /**
     * @template TResponse
     * 
     * @param {string} path
     * @param {import("../utils/types.js").RequestOptions<{}>} options
     * 
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async delete(path, options = {}) {
        return this.#request('delete', path, options);
    }
}

const ApiClient = new Api();
export default ApiClient;


