/**
 * @deprecated Use other API classes instead, this class is not used / updated anymore and will be removed in the future.
 */
export class InfoApi {
    #api;
    #route;
    /**
     * @param {any} api
     */
    constructor(api) {
        this.#api = api;
        this.#route = "info/";
    }
    async getApiVersion() {
        return this.#api.get(this.#route + "api-version");
    }
    async getInfo() {
        return this.#api.get(this.#route);
    }
    async getMetrics() {
        return this.#api.get(this.#route + "metrics");
    }
    async ping() {
        return this.#api.get(this.#route + "ping");
    }
    async getRouteVersion() {
        return this.#api.get(this.#route + "route-version");
    }
}
