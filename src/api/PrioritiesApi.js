import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/PriorityModels.js").PriorityRequest} RequestModel
 * @typedef {import("../Models/PriorityModels.js").PriorityResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class PrioritiesApi extends ApiBase {
    constructor() {
        super("priorities");
    }
}

const api = new PrioritiesApi();
export default api;