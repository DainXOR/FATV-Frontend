import { ApiBase } from "./ApiBase.js";

/**
 * @typedef {import("../Models/FormModels.js").FormRequest} FormRequestModel
 * @typedef {import("../Models/FormModels.js").FormResult} FormResultModel
 */

/**
 * @extends ApiBase<FormRequestModel,FormResultModel>
 */
class FormsApi extends ApiBase {
    #questionsApi
    #answersApi

    constructor() {
        const route = "forms"
        super(route);

        this.#questionsApi = new QuestionsApi(route);
        this.#answersApi = new AnswersApi(route);
    }

    Questions() {
        return this.#questionsApi
    }
    Answers() {
        return this.#answersApi
    }
}

//===============================================================//
//--------------------- Second Layer Routes ---------------------//
//===============================================================//
/**
 * @typedef {import("../Models/FormModels.js").FormQuestionRequest} FormQuestionRequestModel
 * @typedef {import("../Models/FormModels.js").FormQuestionResult} FormQuestionResultModel
 */
/**
 * @extends ApiBase<FormQuestionRequestModel,FormQuestionResultModel>
 */
class QuestionsApi extends ApiBase {
    #questionTypesApi

    /**
     * @param {string} root
     */
    constructor(root) {
        const route = root + "/questions"
        super(route);

        this.#questionTypesApi = new QuestionTypesApi(route)
    }

    Types(){
        return this.#questionTypesApi
    }
}


/**
 * @typedef {import("../Models/FormModels.js").FormAnswerRequest} FormAnswerRequestModel
 * @typedef {import("../Models/FormModels.js").FormAnswerResult} FormAnswerResultModel
 */
/**
 * @extends ApiBase<FormAnswerRequestModel,FormAnswerResultModel>
 */
class AnswersApi extends ApiBase {
    /**
     * @param {string} root
     */
    constructor(root) {
        super(root + "/answers");
    }
}

//===============================================================//
//---------------------- Third Layer Routes ---------------------//z
//===============================================================//

/**
 * @typedef {import("../Models/FormModels.js").FormQuestionTypeRequest} FormQuestionTypeRequestModel
 * @typedef {import("../Models/FormModels.js").FormQuestionTypeResult} FormQuestionTypeResultModel
 */
/**
 * @extends ApiBase<FormQuestionRequestModel,FormQuestionResultModel>
 */
class QuestionTypesApi extends ApiBase {
    /**
     * @param {string} root
     */
    constructor(root) {
        super(root + "/types");
    }
}

const api = new FormsApi();
export default api;