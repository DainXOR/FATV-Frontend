//---------------------- Common Definitions ---------------------//
/**
 * @typedef {Object} ParentQuestion
 * @property {string} id_question
 * @property {string[]} needed_answers
 */

/**
 * @typedef {Object} QuestionInfo
 * @property {string} id_question
 * @property {number} position
 * @property {number} section
 * @property {number} weight
 * @property {boolean} optional
 * @property {ParentQuestion} parent
 */

/**
 * Question ID -> answer value
 * @typedef {Record<string, string>} Answers
 */

/**
 * @typedef {Object} FormQuestionOption
 * @property {string} text
 * @property {number} weight
 */

//------------------------ Models ------------------------//
//---------------------- Form Models ---------------------//
/**
 * @typedef {Object} FormRequest
 * @property {string} name
 * @property {string} description
 * @property {string} date
 * @property {QuestionInfo[]} questions_info
 */
/**
 * @typedef {Object} FormResult
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} date
 * @property {QuestionInfo[]} questions_info
 * @property {string} created_at
 * @property {string} updated_at
 */
//---------------------- Form Question Models ---------------------//
/**
 * @typedef {Object} FormQuestionRequest
 * @property {string} name
 * @property {string} question
 * @property {FormQuestionOption[]} options
 * @property {string} id_question_type
 */
/**
 * @typedef {Object} FormQuestionResult
 * @property {string} id
 * @property {string} name
 * @property {string} question
 * @property {FormQuestionOption[]} options
 * @property {string} id_question_type
 * @property {string} created_at
 * @property {string} updated_at
 */

//---------------------- Answer Models ---------------------//
/**
 * @typedef {Object} FormAnswerRequest
 * @property {string} id_form
 * @property {Answers} answers
 */
/**
 * @typedef {Object} FormAnswerResult
 * @property {string} id
 * @property {string} id_form
 * @property {Answers} answers
 * @property {string} created_at
 * @property {string} updated_at
 */

//---------------------- Form Question Type Models ---------------------//
/**
 * @typedef {Object} FormQuestionTypeRequest
 * @property {string} name
 */
/**
 * @typedef {Object} FormQuestionTypeResult
 * @property {string} id
 * @property {string} name
 * @property {string} created_at
 * @property {string} updated_at
 */

