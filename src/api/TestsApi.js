import { Optional } from "../../../../../5e4c048e/frontend/my-app/src/tools/optional.js";
import { api } from "../../../../../5e4c048e/frontend/my-app/src/routes/api/requestsApi.js";

export class TestApi {
    #api;
    #route;
    constructor(api) {
        this.#api = api;
        this.#route = "test/";
    }
    async get() {
        return this.#api.get(this.#route + "get");
    }
    async post(data) {
        return this.#api.post(this.#route + "post", Optional.from(() => data));
    }
    async put(data) {
        return this.#api.put(this.#route + "put", Optional.from(() => data));
    }
    async patch(data) {
        return this.#api.patch(this.#route + "patch", Optional.from(() => data));
    }
    async delete() {
        return this.#api.delete(this.#route + "del");
    }
    async postWhReceive(data) {
        return this.#api.post(this.#route + "wh/receive", Optional.from(() => data));
    }
    async postWhSend(msg) {
        return this.#api.post(this.#route + `wh/send/${msg}`);
    }
}
