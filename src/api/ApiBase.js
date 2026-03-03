import ApiClient from "./ApiClient";

/**
 * @template TRequest
 * @template TResponse
 */
export class ApiBase {
    #route;
    
    /**
     * @param {string} route
     */
    constructor(route) {
        this.#route = route;
    }
    get route() {
        return this.#route;
    }

    /**
     * @param {string} token
     */
    setToken(token){
        ApiClient.setToken(token)
    }

    /**
     * @param {TRequest} body
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async create(body) {
        return ApiClient.post(this.#route, { body });
    }

    /**
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse[]>>}
     */
    async getAll() {
        return ApiClient.get(`${this.#route}/all`);
    }

    /**
     * @param {string} id
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async getById(id) {
        return ApiClient.get(this.#route, { pathParams: [id] });
    }

    

    /**
     * @param {string} id
     * @param {TRequest} body
     * @returns {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async updateById(id, body) {
        return ApiClient.put(this.#route, {
            pathParams: [id],
            body
        });
    }

    /**
     * @param {string} id
     * @return {Promise<import("../utils/types.js").ApiResult<TResponse>>}
     */
    async deleteById(id) {
        return ApiClient.delete(this.#route, { pathParams: [id] });
    }
}