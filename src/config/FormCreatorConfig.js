/**
 * Configuration constants for FormCreator component.
 * Centralized place to manage default values and behavior settings.
 */

/**
 * @typedef {import("../Models/FormModels.js").SectionType} SectionType
 */

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

/**
 * Number of sections in the form.
 * @type {number}
 */
export const TOTAL_SECTIONS = 4;

/**
 * Default weight per section (in percentage).
 * Total of all sections should equal 100%.
 * @type {number}
 */
export const DEFAULT_SECTION_WEIGHT = 25;

/**
 * Initial section weights distribution.
 * Each section starts with equal weight.
 * @type {{[K in SectionType]: number}}
 */
export const INITIAL_SECTION_WEIGHTS = {
  academic: 25,
  socioeconomic: 25,
  relacional: 25,
  socioemotional: 25
};

// ============================================================================
// QUESTION WEIGHT CONFIGURATION
// ============================================================================

/**
 * Initial weight value for questions when first added.
 * This is the starting value before any auto-distribution.
 * @type {number}
 */
export const INITIAL_QUESTION_WEIGHT = 10;

/**
 * Enable automatic weight distribution for questions.
 * When true: questions divide weights equally by default.
 * When false: questions keep their explicit weights.
 * @type {boolean}
 */
export const AUTO_DISTRIBUTE_QUESTION_WEIGHTS = true;

/**
 * Total weight to distribute among questions within a section (in percentage).
 * @type {number}
 */
export const TOTAL_QUESTION_WEIGHT_PER_SECTION = 100;

/**
 * Calculate equal weight distribution for questions.
 * If there are N questions and auto-distribution is enabled,
 * each untouched question gets (100 / N)% of section weight.
 * 
 * @param {number} questionCount - Number of questions in the section
 * @returns {number} Weight per question
 */
export const calculateEqualWeight = (questionCount) => {
  if (questionCount <= 0) return 0;
  return Math.round((TOTAL_QUESTION_WEIGHT_PER_SECTION / questionCount) * 100) / 100;
};

// ============================================================================
// BEHAVIOR FLAGS
// ============================================================================

/**
 * When true: newly added questions get remaining weight to reach 100%
 * (only if some questions have been manually edited).
 * When false: new questions also get equal distribution.
 * @type {boolean}
 */
export const PRIORITIZE_EDITED_WEIGHTS = true;

/**
 * When true: track which question weights have been manually edited.
 * This affects how new questions are weighted.
 * @type {boolean}
 */
export const TRACK_EDITED_WEIGHTS = true;
