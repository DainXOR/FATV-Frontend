//------------------------------------------------ Request Options ------------------------------------------------//

/**
 * @template TBody
 * @typedef {Object} RequestOptions
 * @property {string[]} [pathParams]
 * @property {Record<string, string | number | boolean>} [queryParams]
 * @property {TBody} [body]
 */

//------------------------------------------------ Request Result Types ------------------------------------------------//

/**
 * @template T
 * @typedef {Object} ApiResultBody
 * @property {T} data
 * @property {string} message
 * @property {any} extra
 */

/**
 * @template T
 * @typedef {Object} ApiResultOk
 * @property {true} ok
 * @property {number} status
 * @property {ApiResultBody<T>} body
 * @property {Record<string, string>} headers
 * @property {import("axios").AxiosResponseHeaders | Partial<Record<string, any>>} rawHeaders
 */

/**
 * 
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {any} [details]
 *
 * 
 * @typedef {Object} ApiResultErr
 * @property {false} ok
 * @property {number} status
 * @property {ApiError} error
 */

/**
 * @template T
 * @typedef {ApiResultOk<T> | ApiResultErr} ApiResult
 */


/**
 * @template T
 * @param {ApiResult<T>} res 
 * @returns {ApiResultErr}
 */
export function expectErr(res) {
  if (res.ok) {
    throw new Error("Expected ApiResultErr, got ok");
  }
  return res;
}

/**
 * @template T
 * @param {ApiResult<T>} res 
 * @returns {ApiResultOk<T>}
 */
export function expectOk(res) {
  if (!res.ok) {
    throw new Error("Expected ApiResultOk, got error");
  }
  return res;
}