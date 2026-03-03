import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/SessionModels.js").SessionRequest} RequestModel
 * @typedef {import("../Models/SessionModels.js").SessionResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class SpecialitiesApi extends ApiBase {
    constructor() {
        super("specialities");
    }
}

const api = new SpecialitiesApi();
export default api;