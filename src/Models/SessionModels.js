//---------------------- Common Definitions ---------------------//
/**
 * @typedef {"Desconocido"|"Pendiente"|"Completado"|"Cancelado"|"No asistió"} SessionStatus
 */

//-------------------------- Models -------------------------//
//---------------------- Session Models ---------------------//
/**
 * @typedef {Object} SessionRequest
 * @property {string} id_student
 * @property {string} id_companion
 * @property {string} id_session_type
 * @property {string} id_contact_reason
 * @property {string} id_vulnerability_type
 * @property {string} session_notes
 * @property {SessionStatus} status
 * @property {string} date
 */

/**
 * @typedef {Object} SessionResult
 * @property {string} id
 * @property {string} id_student
 * @property {string} name
 * @property {string} surname
 * @property {string} id_companion
 * @property {string} companion_name
 * @property {string} companion_surname
 * @property {string} companion_speciality
 * @property {string} id_session_type
 * @property {string} id_contact_reason
 * @property {string} id_vulnerability_type
 * @property {string} session_notes
 * @property {string} depr_date
 * @property {string} date
 * @property {SessionStatus} status
 * @property {string} created_at
 * @property {string} updated_at
 */

//---------------------- Session Type Models ---------------------//
/**
 * @typedef {Object} SessionTypeRequest
 * @property {string} name
 */

/**
 * @typedef {Object} SessionTypeResult
 * @property {string} id
 * @property {string} name
 * @property {string} created_at
 * @property {string} updated_at
 */