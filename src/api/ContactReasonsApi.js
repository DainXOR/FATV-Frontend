import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/ContactReasonModels.js").ContactReasonRequest} RequestModel
 * @typedef {import("../Models/ContactReasonModels.js").ContactReasonResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class ContactReasonsApi extends ApiBase {
    constructor() {
        super("contact-reasons")
    }
}

const api = new ContactReasonsApi();
export default api;