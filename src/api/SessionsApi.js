import { ApiBase } from "./ApiBase.js";
import ApiClient from "./ApiClient";

/**
 * @typedef {import("../Models/SessionModels.js").SessionRequest} SessionRequestModel
 * @typedef {import("../Models/SessionModels.js").SessionResult} SessionResultModel
 */

/**
 * @extends ApiBase<SessionRequestModel,SessionResultModel>
 */
class SessionsApi extends ApiBase {
    #typesApi;

    constructor() {
        super("sessions")
        
        this.#typesApi = new SessionTypesApi("sessions");
    }

    Types(){
        return this.#typesApi
    }

    /**
     * @param {string} id
     * @return {Promise<import("../utils/types.js").ApiResult<SessionResultModel[]>>}
     */
    async getByStudentId(id) {
        return ApiClient.get(this.route + "/student", { pathParams: [id] });
    }
}

/**
 * @typedef {import("../Models/SessionModels.js").SessionTypeRequest} SessionTypeRequestModel
 * @typedef {import("../Models/SessionModels.js").SessionTypeResult} SessionTypeResultModel
 */

/**
 * @extends ApiBase<SessionTypeRequestModel,SessionTypeResultModel>
 */
class SessionTypesApi extends ApiBase {
    /**
     * @param {string} route
     */
    constructor(route) {
        super(route + "/types");
    }
}

const api = new SessionsApi();
export default api;