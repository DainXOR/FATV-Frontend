import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/UniversityModels.js").UniversityRequest} RequestModel
 * @typedef {import("../Models/UniversityModels.js").UniversityResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class UniversitiesApi extends ApiBase {
    constructor() {
        super("universities");
    }
}

const api = new UniversitiesApi();
export default api;