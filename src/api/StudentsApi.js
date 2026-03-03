import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/StudentModels.js").StudentRequest} RequestModel
 * @typedef {import("../Models/StudentModels.js").StudentResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class StudentsApi extends ApiBase {
    constructor() {
        super("students");
    }
}

const api = new StudentsApi();
export default api;