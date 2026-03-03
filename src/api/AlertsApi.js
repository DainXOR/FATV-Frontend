import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/AlertModels.js").AlertRequest} RequestModel
 * @typedef {import("../Models/AlertModels.js").AlertResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class AlertsApi extends ApiBase {
    constructor() {
        super("alerts");
    }
}

const api = new AlertsApi();
export default api;