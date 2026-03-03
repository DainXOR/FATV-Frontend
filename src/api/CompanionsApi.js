import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/CompanionModels.js").CompanionRequest} RequestModel
 * @typedef {import("../Models/CompanionModels.js").CompanionResult} ResultModel
 */

/**
 * @extends ApiBase<RequestModel,ResultModel>
 */
class CompanionsApi extends ApiBase {
  constructor() {
    super("companions");
  }
}

const api = new CompanionsApi();
export default api;