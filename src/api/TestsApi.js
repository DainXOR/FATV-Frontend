import ApiClient from "./ApiClient";

export class TestApi {
    /** @type {string} */
    #route;

    constructor() {
        this.#route = "test";
    }

    async get() {
        return ApiClient.get(`${this.#route}/get`);
    }

    /**
     * @param {any} data 
     * @returns 
     */
    async post(data) {
        return ApiClient.post(`${this.#route}/post`, {body: data});
    }

    /**
     * @param {any} data 
     * @returns 
     */
    async put(data) {
        return ApiClient.put(`${this.#route}/put`, {body: data});
    }

    /**
     * @param {any} data 
     * @returns 
     */
    async patch(data) {
        return ApiClient.patch(`${this.#route}/patch`, {body: data});
    }
    async delete() {
        return ApiClient.delete(`${this.#route}/delete`);
    }

    /**
     * @param {any} data 
     * @returns 
     */
    async postWhReceive(data) {
        return ApiClient.post(`${this.#route}/wh/receive`, {body: data});
    }

    /**
     * @param {string} msg
     * @returns 
     */
    async postWhSend(msg) {
        return ApiClient.post(`${this.#route}/wh/send`, {pathParams: [msg]});
    }
}
