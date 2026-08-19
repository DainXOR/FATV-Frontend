import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import '../Estilos/FormCreator.css';
import { Button } from '@mui/material';
import FormApi from '../api/FormsApi.js';
import Swal from 'sweetalert2';
import {
  INITIAL_SECTION_WEIGHTS,
  INITIAL_QUESTION_WEIGHT,
} from '../config/FormCreatorConfig.js';

/**
 * @typedef {import("../Models/StudentModels.js").StudentResult} StudentResult
 * @typedef {import("../Models/FormModels.js").FormQuestionResult} FormQuestionResult
 * @typedef {import("../Models/FormModels.js").FormRequest} FormRequest
 * @typedef {import("../Models/FormModels.js").FormQuestionRequest} FormQuestionRequest
 * @typedef {import("../Models/FormModels.js").FormQuestionOption} FormQuestionOption
 * @typedef {import("../Models/FormModels.js").QuestionInfo} QuestionInfo
 */

/**
 * @typedef {'text' | 'single_choice' | 'multiple_choice' | 'true_false'} QuestionType
 */

/**
 * Readable fromat question.
 * @typedef {Object} ReadableQuestion
 * @property {string} id - Unique identifier (client-generated timestamp)
 * @property {string} name - Question name
 * @property {string} question - Question text
 * @property {QuestionType} type - Question type
 * @property {FormQuestionOption[]} options - Answer options for choice/multiple questions
 */

/**
 * Configuration for a selected question's answer format.
 * @typedef {Object} ConfiguredQuestion
 * @property {QuestionType} type - Question type
 * @property {string[]} options - Answer options for choice/multiple questions
 */

/**
 * @typedef {Object} LocalStudent
 * @property {string} id
 * @property {string} number_id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} phone_number
 * @property {string} email
 * @property {string} fullName
 */

/**
 * @typedef {import("../Models/FormModels.js").SectionType} SectionType
 */

/**
 * Relative weight used to derive a question's percentage share within its scope
 * (global form, or its section, depending on `positionsAreGlobal`). Percentages
 * are always derived at render/submit time as weight / sum(weights in scope),
 * so they can never fail to add up to 100%.
 *
 * @typedef {Object} QuestionConfig
 * @property {SectionType} section
 * @property {boolean} optional
 * @property {string} parentQuestionId
 * @property {string[]} neededAnswers
 * @property {number} weight - Raw relative weight inside their section
 */

/**
 * @typedef {{[questionId: string]: QuestionConfig}} QuestionConfigMap
 */

/**
 * @typedef {Object} SelectedQuestionPayload
 * @property {string} id
 * @property {string} name
 * @property {string} question
 * @property {QuestionType} type
 * @property {FormQuestionOption[]} options
 * @property {QuestionConfig} config
 */


/**
 * Maps frontend question type to backend ID.
 *
 * @param {QuestionType} type - The frontend type ('text', 'single_choice', 'multiple_choice', 'true_false').
 * @returns {string} The backend ID for the type.
 */
const mapTypeToBackend = (type) => {
  switch (type) {
    case 'text':
      return "6907fecf128fd20a55377835"; 
    case 'single_choice':
      return "6908227395ecaa45d56b5d84"; 
    case 'multiple_choice':
      return "69080917bd94203556594133"; 
    case 'true_false':
      return "6908227e95ecaa45d56b5d85"; 
    default:
      return "";
  }
};
const mapBackendToType = (/** @type {String} */ backendId) => {
  switch (backendId) {
    case "6907fecf128fd20a55377835": return 'text';
    case "6908227395ecaa45d56b5d84": return 'single_choice';
    case "69080917bd94203556594133": return 'multiple_choice';
    case "6908227e95ecaa45d56b5d85": return 'true_false';
    default: return 'text';
  }
};
const getReadableQuestionType = (/** @type {String} */ backendId) => {
  switch (mapBackendToType(backendId)) {
    case 'text': return 'Texto libre';
    case 'single_choice': return 'Opción única';
    case 'multiple_choice': return 'Múltiple respuesta';
    case 'true_false': return 'Verdadero / Falso';
    default: return 'Texto libre';
  }
};

const sectionOptions = [
  { value: 'academic', label: 'Académico' },
  { value: 'socioeconomic', label: 'Socioeconómico' },
  { value: 'relacional', label: 'Relacional' },
  { value: 'socioemotional', label: 'Socioemocional' }
];

const defaultSectionOrder = /** @type {SectionType[]} */ ([
  'academic',
  'socioeconomic',
  'relacional',
  'socioemotional'
]);

const defaultSectionWeights = INITIAL_SECTION_WEIGHTS;

const hasOptions = (/** @type {FormQuestionResult} */ q) => {
  const type = mapBackendToType(q.id_question_type);
  return type !== 'text' && (q.options || []).length > 0;
};

/**
 * FormCreator component for creating and configuring forms with questions for students.
 *
 * @param {Object} props - Component props.
 * @param {() => void} props.onBack - Callback function to go back.
 * @returns {React.JSX.Element}
 */
const FormCreator = ({ onBack }) => {
  const [questions, setQuestions] = useState(/** @type {FormQuestionResult[]} */([]));
  const [selectedQuestionIDs, setSelectedQuestionIDs] = useState(/** @type {string[]} */([]));
  const [selectedQuestionConfigs, setSelectedQuestionConfigs] = useState(/** @type {QuestionConfigMap} */ ({}));
  const [positionsAreGlobal, setPositionsAreGlobal] = useState(/** @type {boolean} */ (true));
  const [sectionOrder, setSectionOrder] = useState(/** @type {SectionType[]} */ (defaultSectionOrder));
  const questionNodeRefs = useRef(/** @type {Map<string, HTMLDivElement>} */ (new Map()));
  const sectionNodeRefs = useRef(/** @type {Map<SectionType, HTMLDivElement>} */ (new Map()));
  const pendingFlip = useRef(/** @type {'question'|'section'|null} */ (null));
  const oldPositions = useRef({
    questions: /** @type {Map<string, DOMRect>} */ (new Map()),
    sections: /** @type {Map<SectionType, DOMRect>} */ (new Map())
  });
  const [questionFilterText, setQuestionFilterText] = useState('');
  const [questionFilterType, setQuestionFilterType] = useState('all');
  const [mode, setMode] = useState(/** @type {'select' | 'create-custom'} */('select')); 
  const [formError, setFormError] = useState(/** @type {string | null} */(null));
  const [formSuccess, setFormSuccess] = useState(/** @type {string | null} */(null));
  const [generatedUrl, setGeneratedUrl] = useState(/** @type {string | null} */(null));
  const [isGenerating, setIsGenerating] = useState(/** @type {boolean} */(false));

  // Single manual question editor (used only in create-custom mode)
  const [manualQuestion, setManualQuestion] = useState(/** @type {ReadableQuestion} */ ({
    id: `m${Date.now()}`,
    name: '',
    question: '',
    type: 'text',
    options: [] 
  }));

  const [formName, setFormName] = useState(/** @type {string} */(''));
  const [formDescription, setFormDescription] = useState(/** @type {string} */(''));
  const [sectionWeights, setSectionWeights] = useState(/** @type {{[K in SectionType]: number}} */ (
    defaultSectionWeights
  ));

  const startCreateQuestion = () => {
    setManualQuestion({ id: `m${Date.now()}`, name: '', question: '', type: 'text', options: [] });
    setMode('create-custom');
  };

  const cancelCreateQuestion = () => {
    setManualQuestion({ id: `m${Date.now()}`, name: '', question: '', type: 'text', options: [] });
    setMode('select');
  };

  const saveManualQuestion = async () => {
    if (!((manualQuestion.name || '').trim())) {
      Swal.fire('Error', 'El nombre de la pregunta no puede estar vacío', 'error');
      return;
    }
    if (!((manualQuestion.question || '').trim())) {
      Swal.fire('Error', 'La pregunta no puede estar vacía', 'error');
      return;
    }

    const isEditing = questions.some(q => q.id === manualQuestion.id);

    try {
      const payload = /** @type {FormQuestionRequest} */  ({
        name: manualQuestion.name.trim(),
        question: manualQuestion.question,
        options: manualQuestion.options || [],
        id_question_type: mapTypeToBackend(manualQuestion.type)
      });

      const res = isEditing
        ? await FormApi.Questions().patchById(manualQuestion.id, payload)
        : await FormApi.Questions().create(payload);

      if (!res.ok) throw new Error(res.error?.message || 'Error guardando pregunta');
      const saved = res.body.data;

      setQuestions(prev => isEditing ? prev.map(q => q.id === manualQuestion.id ? saved : q) : [...prev, saved]);
      Swal.fire('Guardado', 'Pregunta guardada correctamente', 'success');
      setMode('select');
    } catch (err) {
      const caught = /** @type {any} */ (err);
      console.error(caught);
      Swal.fire('Error', caught.message || 'No se pudo guardar la pregunta', 'error');
    }
  };

  const startEditQuestion = (/** @type {FormQuestionResult} */ q) => {
    setManualQuestion({
      id: q.id,
      name: q.name || '',
      question: q.question || '',
      type: mapBackendToType(q.id_question_type),
      options: q.options || []
    });
    setMode('create-custom');
  };

  const deleteQuestion = async (/** @type {FormQuestionResult} */ q) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar pregunta?',
      text: `Esta acción no se puede deshacer: "${q.name || q.question}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await FormApi.Questions().deleteById(q.id);
      if (!res.ok) throw new Error(res.error?.message || 'Error eliminando pregunta');
      setQuestions(prev => prev.filter(item => item.id !== q.id));
      setSelectedQuestionIDs(prev => prev.filter(id => id !== q.id));
      setSelectedQuestionConfigs(prev => {
        const { [q.id]: removed, ...rest } = prev;
        return Object.fromEntries(Object.entries(rest).map(([questionId, config]) => {
          if (config.parentQuestionId === q.id) {
            return [questionId, { ...config, parentQuestionId: '', neededAnswers: [] }];
          }
          return [questionId, config];
        }));
      });
    } catch (err) {
      const caught = /** @type {any} */ (err);
      console.error(caught);
      Swal.fire('Error', caught.message || 'No se pudo eliminar la pregunta', 'error');
    }
  };

  const normalizeText = (/** @type {string} */ str) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .toLowerCase();
  };

  /**
   * Checks if every character group (word) in `query`, in order, appears as a
   * subsequence somewhere in `text`. Allows skipping characters between matches,
   * so "what nam" matches "What is your name" and "wiyn" matches the initials
   * pattern across words.
   */
  const fuzzyMatch = (/** @type {string} */ text, /** @type {string} */ query) => {
    const normalizedText = normalizeText(text);
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;

    const isSubsequence = (/** @type {string} */ str, /** @type {string} */ sub) => {
      let idx = 0;
      for (const char of sub) {
        const found = str.indexOf(char, idx);
        if (found === -1) return false;
        idx = found + 1;
      }
      return true;
    };

    return words.every(w => isSubsequence(normalizedText, w));
  };

  const getFilteredQuestions = () => {
    return questions.filter(q => {
      if (!q) return false;
      const typeMatch = questionFilterType === 'all' || mapBackendToType(q.id_question_type) === questionFilterType;
      if (!typeMatch) return false;

      const term = (questionFilterText || '').trim();
      if (!term) return true;

      const haystack = `${q.name || ''} ${q.question || ''}`;
      return fuzzyMatch(haystack, term);
    });
  };

  const getDefaultQuestionConfig = (/** @type {string} */ questionId) => ({
    section: 'academic',
    optional: false,
    parentQuestionId: '',
    neededAnswers: [],
    weight: INITIAL_QUESTION_WEIGHT
  });

  const getSectionWeightPercentage = (/** @type {SectionType} */ sectionType) => {
    const total = sectionOrder.reduce(
      (sum, type) => sum + (Number(sectionWeights[type]) || 0),
      0
    );

    if (total <= 0) return 0;

    return Math.round(
      ((Number(sectionWeights[sectionType]) || 0) / total) * 100 * 100
    ) / 100;
  };


  ///**
  // * Returns the raw relative weight for the currently active scope
  // * (global form order vs. grouped-by-section order).
  // *
  // * @param {QuestionConfig} config
  // * @returns {number}
  // */

  //const getActiveWeight = (config) => {
  //  return typeof config.weight === 'number' && !Number.isNaN(config.weight) ? config.weight : 0;
  //};

  

  const getSelectedQuestionObjects = () => {
    return /** @type {FormQuestionResult[]} */ (selectedQuestionIDs
      .map(id => questions.find(q => q.id === id))
      .filter((q) => q != null));
  };

  const normalizeNeededAnswers = (/** @type {string} */ raw) => {
    return raw
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);
  };

  const isSingleAnswerType = (/** @type {QuestionType} */ type) => {
    return type === 'single_choice' || type === 'true_false';
  };

  const isOpenAnswerType = (/** @type {QuestionType} */ type) => {
    return type === 'text';
  };
  const isMultiAnswerType = (/** @type {QuestionType} */ type) => {
    return type === 'multiple_choice';
  };

  const getQuestionTypeById = (/** @type {string} */ questionId) => {
    const question = questions.find(q => q.id === questionId);
    return question ? mapBackendToType(question.id_question_type) : 'text';
  };

  /**
   * @param {'question' | 'section'} type
   */
  const capturePositions = (type) => {
    const result = new Map();
    const refsMap = type === 'question' ? questionNodeRefs.current : sectionNodeRefs.current;
    refsMap.forEach((node, key) => {
      if (node) {
        result.set(key, node.getBoundingClientRect());
      }
    });
    return result;
  };

  /**
   * @param {'question' | 'section'} type
   */
  const animateFlip = (type) => {
    const refsMap = type === 'question' ? questionNodeRefs.current : sectionNodeRefs.current;
    const sourceRects = type === 'question' ? oldPositions.current.questions : oldPositions.current.sections;

    refsMap.forEach((node, key) => {
      const oldRect = sourceRects.get(key);
      if (!oldRect) return;
      const newRect = node.getBoundingClientRect();
      const deltaX = oldRect.left - newRect.left;
      const deltaY = oldRect.top - newRect.top;

      if (deltaX === 0 && deltaY === 0) return;
      node.style.transition = 'none';
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      node.style.willChange = 'transform';
      node.getBoundingClientRect();
      requestAnimationFrame(() => {
        node.style.transition = 'transform 280ms ease';
        node.style.transform = '';
      });
      const cleanup = () => {
        node.style.transition = '';
        node.style.transform = '';
        node.style.willChange = '';
        node.removeEventListener('transitionend', cleanup);
      };
      node.addEventListener('transitionend', cleanup);
    });
  };

  useLayoutEffect(() => {
    if (pendingFlip.current === 'question') {
      animateFlip('question');
      pendingFlip.current = null;
      oldPositions.current.questions.clear();
    }
    if (pendingFlip.current === 'section') {
      animateFlip('section');
      pendingFlip.current = null;
      oldPositions.current.sections.clear();
    }
  }, [selectedQuestionIDs, sectionOrder, positionsAreGlobal, selectedQuestionConfigs]);

  const updateQuestionConfig = (/** @type {string} */ questionId, /** @type {Partial<QuestionConfig>} */ changes) => {
    const currentConfig = selectedQuestionConfigs[questionId] || getDefaultQuestionConfig(questionId);
    if (changes.section !== undefined && changes.section !== currentConfig.section) {
      oldPositions.current.questions = capturePositions('question');
      pendingFlip.current = 'question';
    }

    setSelectedQuestionConfigs(prev => {
      const nextConfig = {
        ...getDefaultQuestionConfig(questionId),
        ...prev[questionId],
        ...changes,
      };

      const parentType = nextConfig.parentQuestionId
        ? getQuestionTypeById(nextConfig.parentQuestionId)
        : null;

      if (parentType && isOpenAnswerType(parentType)) {
        nextConfig.neededAnswers = [];
      }

      if (parentType && isSingleAnswerType(parentType) && nextConfig.neededAnswers.length > 1) {
        nextConfig.neededAnswers = [nextConfig.neededAnswers[0]];
      }

      return {
        ...prev,
        [questionId]: nextConfig,
      };
    });
  };

  const moveQuestion = (/** @type {string} */ id, /** @type {'up'|'down'} */ direction) => {
    oldPositions.current.questions = capturePositions('question');
    pendingFlip.current = 'question';
    setSelectedQuestionIDs(prev => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const nextState = [...prev];
      [nextState[currentIndex], nextState[nextIndex]] = [nextState[nextIndex], nextState[currentIndex]];
      return nextState;
    });
  };

  const toggleQuestion = (/** @type {string} */ id) => {
    setSelectedQuestionIDs(prev => {
      if (prev.includes(id)) {
        // Removing a question — weights are relative, so nothing else needs
        // to change: everyone else's share of 100% grows automatically
        // because the denominator (sum of weights) shrinks.
        const next = prev.filter(x => x !== id);
        setSelectedQuestionConfigs(prevConfig => {
          const { [id]: removed, ...rest } = prevConfig;
          return Object.fromEntries(Object.entries(rest).map(([questionId, config]) => {
            if (config.parentQuestionId === id) {
              return [questionId, { ...config, parentQuestionId: '', neededAnswers: [] }];
            }
            return [questionId, config];
          }));
        });
        return next;
      }

      // Adding a new question — give it the default raw weight; existing
      // questions' raw weights are untouched, their computed % simply shifts
      // to make room since the denominator grows.
      setSelectedQuestionConfigs(prevConfig => ({
        ...prevConfig,
        [id]: prevConfig[id] || getDefaultQuestionConfig(id)
      }));
      return [...prev, id];
    });
  };

  /**
   * Builds the payload of questions based on the current mode and selections.
   * In 'select' mode: returns questions with configured answer types.
   * In 'create-custom' mode: returns user-created questions.
   *
   * PROPERTY MISMATCH EXPLANATIONS (These errors can be ignored for now):
   * 
   * For 'select' mode:
   *   - q.text (Line 118): FormQuestionResult has 'question' not 'text'
   *     → We transform backend question→text for UI consistency
   *   - q.type (Line 119): FormQuestionResult has 'id_question_type' not 'type'  
   *     → Type comes from configuredQuestions state (user's UI selection)
   *     → We use user's choice, not backend's id_question_type
   *
   * For 'create-custom' mode:
   *   - m.text, m.id, m.type, m.options: These ARE correct (UserCreatedQuestion typedef)
   *     → manualQuestions might be typed incorrectly in useState (shows 'never')
   *     → Actually contains UserCreatedQuestion objects at runtime
   *
   * @returns {SelectedQuestionPayload[]} The array of question payloads.
   */
  const buildQuestionsPayload = () => {
    return /** @type {SelectedQuestionPayload[]} */ (getSelectedQuestionObjects().map(q => ({
      id: q.id,
      name: q.name,
      question: q.question,
      type: mapBackendToType(q.id_question_type),
      options: q.options || [],
      config: selectedQuestionConfigs[q.id] || getDefaultQuestionConfig(q.id)
    })));
  };

  /**
   * Gets all questions in a given section from the current selection.
   *
   * @param {SectionType} sectionType - The section to filter by
   * @returns {FormQuestionResult[]} Questions in that section
   */
  const getQuestionsInSection = (sectionType) => {
    return selectedQuestionIDs
      .map(id => questions.find(q => q.id === id))
      .filter(q => q != null)
      .filter(q => {
        const config = selectedQuestionConfigs[q.id] || getDefaultQuestionConfig(q.id);
        return config.section === sectionType;
      });
  };

  /**
   * Computes the normalized percentage for a question given the raw weights
   * of every question sharing its scope (global list, or its section).
   *
   * @param {FormQuestionResult} question
   * @param {FormQuestionResult[]} scopeQuestions - All questions sharing this weight scope
   * @returns {number} Percentage (0-100), rounded to 2 decimals
   */
  const getComputedPercentage = (question, scopeQuestions) => {
    const config = selectedQuestionConfigs[question.id] || getDefaultQuestionConfig(question.id);
    const totalWeight = scopeQuestions.reduce((sum, q) => {
      const c = selectedQuestionConfigs[q.id] || getDefaultQuestionConfig(q.id);
      return sum + c.weight;
    }, 0);

    if (totalWeight <= 0) return 0;
    return Math.round((config.weight / totalWeight) * 100 * 100) / 100;
  };

  /**
   * Returns a human-readable label of what % a question currently represents,
   * within its scope (whole form if global, its section if grouped).
   *
   * @param {FormQuestionResult} question
   * @param {SectionType} sectionType
   * @returns {string}
   */
  const getWeightHint = (question, sectionType) => {
    const scopeQuestions = getQuestionsInSection(sectionType);

    if (scopeQuestions.length === 0) return 'Sin preguntas en esta sección';

    const percentage = getComputedPercentage(question, scopeQuestions);
    const scopeLabel = positionsAreGlobal ? 'de su sección' : 'de la sección';
    return `Equivale a ${percentage}% ${scopeLabel}`;
  };

  const prepareInputs = () => {
    const questionsPayload = buildQuestionsPayload();

    if (!questionsPayload.length) {
      const error = /** @type {Error & { code?: string }} */ (new Error('Agregue al menos una pregunta con texto antes de generar el URL.'));
      error.code = 'NO_QUESTIONS';
      throw error;
    }


    for (const item of questionsPayload) {
      const config = item.config || getDefaultQuestionConfig(item.id);
      if (!config.parentQuestionId) continue;

      const parentType = getQuestionTypeById(config.parentQuestionId);
      if (isOpenAnswerType(parentType) && config.neededAnswers.length > 0) {
        const error = /** @type {Error & { code?: string }} */ (new Error('La pregunta previa es de texto abierto y no puede tener respuestas necesarias.'));
        error.code = 'INVALID_PARENT_ANSWER';
        throw error;
      }
      if (isSingleAnswerType(parentType) && config.neededAnswers.length !== 1) {
        const error = /** @type {Error & { code?: string }} */ (new Error('La pregunta previa admite solo una respuesta necesaria.'));
        error.code = 'INVALID_PARENT_ANSWER';
        throw error;
      }
      if (isMultiAnswerType(parentType) && config.neededAnswers.length < 1) {
        const error = /** @type {Error & { code?: string }} */ (new Error('La pregunta previa debe tener una o más respuestas necesarias.'));
        error.code = 'INVALID_PARENT_ANSWER';
        throw error;
      }
    }

    return questionsPayload;
  };

  const moveSection = (/** @type {SectionType} */ sectionType, /** @type {'up' | 'down'} */ direction) => {
    oldPositions.current.sections = capturePositions('section');
    pendingFlip.current = 'section';
    setSectionOrder(prev => {
      const index = prev.indexOf(sectionType);
      if (index === -1) return prev;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const getSectionNumber = (/** @type {SectionType} */ sectionType) => {
    const index = sectionOrder.indexOf(sectionType);
    return index >= 0 ? index + 1 : 1;
  };

  const buildFormPayload = (/** @type {SelectedQuestionPayload[]} */ questionsPayload) => {
    const sectionGroups = /** @type {{[sectionPosition: number]: QuestionInfo[]}} */ ({
      1: [],
      2: [],
      3: [],
      4: []
    });

    // Question weights are stored and submitted as their actual raw values.
    // Percentages are only calculated for display in the UI.
    const sectionMetadata = sectionOrder.reduce((acc, sectionType, index) => {
      acc[index + 1] = {
        name: getSectionLabel(sectionType),
        weight: sectionWeights[sectionType] ?? 0
      };
      return acc;
    }, /** @type {{[sectionPosition: number]: import("../Models/FormModels.js").SectionInfo}} */ ({
      1: { name: 'Académico', weight: 0 },
      2: { name: 'Socioeconómico', weight: 0 },
      3: { name: 'Relacional', weight: 0 },
      4: { name: 'Socioemocional', weight: 0 }
    }));

    const questionsInfo = questionsPayload.map((q, index) => {
        const config = q.config || getDefaultQuestionConfig(q.id);
        const sectionType = config.section;
        const sectionPosition = getSectionNumber(sectionType);
        const sectionList = sectionGroups[sectionPosition] || [];
        const position = positionsAreGlobal
          ? index + 1
          : sectionList.length + 1;

        // IMPORTANT:
        // Send the raw question weight to the backend.
        // Do not normalize it to a percentage.
        const rawWeight = config.weight;

        const questionInfo = /** @type {QuestionInfo} */ ({
          position,
          id_question: q.id,
          weight: rawWeight,
          optional: config.optional || false,
          parent: {
            id_question: config.parentQuestionId || '',
            needed_answers: config.neededAnswers || []
          }
        });

        sectionGroups[sectionPosition] = [
          ...sectionList,
          questionInfo
        ];

        return questionInfo;
      }
    );

    return {
      name: formName.trim(),
      description: formDescription.trim(),
      date: new Date().toISOString(),
      sections: sectionGroups,
      sections_info: sectionMetadata,
      positions_are_global: positionsAreGlobal,
      questions_info: questionsInfo,
    };
  };

  const submitForm = async (/** @type {FormRequest} */ formPayload) => {
    const response = await FormApi.create(formPayload);
    if (!response.ok) {
      const error = /** @type {Error & { code?: string | number; details?: any }} */ (new Error(response.error?.message || 'Error al crear formulario'));
      error.code = response.status;
      error.details = response.error;
      throw error;
    }

    const newFormId = response.body.data.id;
    if (!newFormId) {
      const error = /** @type {Error & { code?: string }} */ (new Error('El backend no devolvió un ID de formulario.'));
      error.code = 'MISSING_ID';
      throw error;
    }

    return newFormId;
  };

  const handleGenerateUrl = async () => {
    setFormError(null);
    setFormSuccess(null);
    setGeneratedUrl(null);
    setIsGenerating(true);

    try {
      const questionsPayload = prepareInputs();
      const formPayload = buildFormPayload(questionsPayload);
      const newFormId = await submitForm(formPayload);

      const studentFormUrl = `${window.location.origin}/student-form/${newFormId}`;
      setGeneratedUrl(studentFormUrl);
      setFormSuccess('URL generada correctamente. Comparte este enlace con el estudiante.');

      Swal.fire({
        title: '¡Formulario creado!',
        text: 'El formulario ha sido generado exitosamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#673ab7',
      });
    } catch (error) {
      const caught = /** @type {any} */ (error);
      const statusCode = caught.status || caught.code || 'UNKNOWN';
      const message = caught.message || 'Error al generar el formulario';
      const details = caught.details || caught;

      console.error('Error al generar URL:', { statusCode, message, details });
      setFormError(message);

      Swal.fire({
        title: 'Error',
        text: `${message} (${statusCode})`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copies the generated URL to the clipboard.
   */
  const copyUrlToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl).then(() => {
        Swal.fire({
          title: '¡Copiado!',
          text: 'El URL ha sido copiado al portapapeles',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#673ab7',
          timer: 2000
        });
      }).catch(err => {
        console.error('Error al copiar:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo copiar el URL',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        });
      });
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await FormApi.Questions().getAll();

        if (!response.ok) {
          throw new Error(response.error?.message || 'Error al cargar preguntas');
        }

        const questions = response.body.data;
        if (!Array.isArray(questions)) {
          console.error("El backend NO devolvió una lista en 'data'");
          return;
        }
        setQuestions(questions);
      } catch (err) {
        console.error("Error cargando preguntas:", err);
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar las preguntas.",
          icon: "error",
          confirmButtonText: "Aceptar"
        });
      }
    };
    fetchQuestions();
  }, []);


  /**
   * Gets the correct CSS class for mode button.
   * Extracted from: className={"mode-btn " + (mode === 'select' ? 'active' : '')}
   */
  const getModeButtonClass = (/** @type {string} */ buttonMode) => {
    const baseClass = 'mode-btn';
    const isActive = mode === buttonMode;
    return isActive ? `${baseClass} active` : baseClass;
  };

  const getSectionLabel = (/** @type {SectionType} */ key) => {
    const section = sectionOptions.find(item => item.value === key);
    return section ? section.label : key;
  };

  const renderQuestionConfigRow = (/** @type {FormQuestionResult} */ q, /** @type {number} */ index, /** @type {FormQuestionResult[]} */ visibleList) => {
    const config = selectedQuestionConfigs[q.id] || getDefaultQuestionConfig(q.id);
    const parentCandidates = visibleList.filter(item => item.id !== q.id);
    const parentQuestion = questions.find(item => item.id === config.parentQuestionId);
    const parentQuestionType = parentQuestion ? mapBackendToType(parentQuestion.id_question_type) : null;
    const parentQuestionOptions = parentQuestion && hasOptions(parentQuestion)
      ? parentQuestion.options.map(opt => opt.text)
      : [];
    const parentIsOpen = parentQuestionType ? isOpenAnswerType(parentQuestionType) : false;
    const parentIsSingle = parentQuestionType ? isSingleAnswerType(parentQuestionType) : false;

    return (
      <div
        key={q.id}
        ref={(node) => {
          if (node) {
            questionNodeRefs.current.set(q.id, node);
          } else {
            questionNodeRefs.current.delete(q.id);
          }
        }}
        className="config-row">
        <div className="config-question-text">{index + 1}. {q.name}</div>

        <div className="config-fields-row">
          <div className="config-field">
            <label>Sección</label>
            <select
              value={config.section}
              className="config-type-select"
              onChange={(e) => {
                const newSection = /** @type {SectionType} */ (e.target.value);
                if (config.section === newSection) return;
                updateQuestionConfig(q.id, { section: newSection });
              }}
            >
              {sectionOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="config-field config-field-checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.optional}
                onChange={(e) => updateQuestionConfig(q.id, { optional: e.target.checked })}
              />
              Opcional
            </label>
          </div>

          <div className="config-field">
            <label>Peso</label>
            <input
              type="number"
              min={1}
              step={1}
              value={config.weight}
              className="config-type-select"
              onChange={(e) => {
                const parsed = Math.round(Number(e.target.value));

                const nextWeight = Number.isFinite(parsed)
                  ? Math.min(255, Math.max(1, parsed))
                  : 1;

                updateQuestionConfig(
                  q.id,
                  {weight: nextWeight}
                );
              }}

            />
            <small className="config-help">
              {getWeightHint(q, config.section)}
            </small>
          </div>
        </div>

        <div className="config-field">
          <label>Pregunta previa</label>
          <select
            value={config.parentQuestionId || ''}
            className="config-type-select"
            onChange={(e) => updateQuestionConfig(q.id, {
              parentQuestionId: e.target.value,
              neededAnswers: []
            })}
          >
            <option value="">Ninguna</option>
            {parentCandidates.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        {config.parentQuestionId && (
          <div className="needed-answers-block">
            <label>Respuestas necesarias</label>
            {parentIsOpen ? (
              <div className="parent-open-warning">
                Esta pregunta previa es de respuesta abierta. No se requieren respuestas concretas.
              </div>
            ) : parentQuestionOptions.length ? (
              <div className="options-editor">
                {parentQuestionOptions.map((text, optIndex) => {
                  const selected = config.neededAnswers.includes(text);
                  return (
                    <label key={optIndex} className="option-row">
                      <input
                        type={parentIsSingle ? 'radio' : 'checkbox'}
                        name={`needed-answer-${q.id}`}
                        checked={selected}
                        value={text}
                        onChange={() => {
                          const nextAnswers = parentIsSingle
                            ? [text]
                            : selected
                              ? config.neededAnswers.filter(item => item !== text)
                              : [...config.neededAnswers, text];
                          updateQuestionConfig(q.id, { neededAnswers: nextAnswers });
                        }}
                      />
                      {text}
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                className="option-input"
                placeholder="Ej: Sí, No"
                value={config.neededAnswers.join(', ')}
                onChange={(e) => updateQuestionConfig(q.id, { neededAnswers: normalizeNeededAnswers(e.target.value) })}
              />
            )}
            <small className="config-help">
              {parentIsOpen
                ? 'Las preguntas abiertas no usan valores obligatorios.'
                : parentIsSingle
                  ? 'Selecciona una sola respuesta que active esta pregunta.'
                  : 'Selecciona una o más respuestas que activen esta pregunta.'}
            </small>
          </div>
        )}

        <div className="config-row-actions">
          <button
            className="row-move-btn"
            type="button"
            onClick={() => moveQuestion(q.id, 'up')}
            disabled={index === 0}
          >
            ↑ Subir
          </button>
          <button
            className="row-move-btn"
            type="button"
            onClick={() => moveQuestion(q.id, 'down')}
            disabled={index === visibleList.length - 1}
          >
            ↓ Bajar
          </button>
          <button
            className="remove-question-btn"
            type="button"
            onClick={() => toggleQuestion(q.id)}
          >
            Quitar de selección
          </button>
        </div>
      </div>
    );
  };

  const renderSelectedQuestionBuilder = () => {
    const selectedQuestions = getSelectedQuestionObjects();

    const questionsBySection = sectionOrder.reduce((acc, sectionType) => {
      acc[sectionType] = selectedQuestions.filter(q => {
        const config = selectedQuestionConfigs[q.id] || getDefaultQuestionConfig(q.id);
        return config.section === sectionType;
      });
      return acc;
    }, /** @type {{[K in SectionType]: FormQuestionResult[]}} */ ({
      academic: [],
      socioeconomic: [],
      relacional: [],
      socioemotional: []
    }));

    return (
      <div className="selected-config">
        <div className="selected-config-header">
          <h4>Configuración del formulario</h4>
          <span className="mode-badge">
            {positionsAreGlobal ? 'Modo: Posición global' : 'Modo: Agrupado por sección'}
          </span>
        </div>

        {selectedQuestions.length > 0 && (
          <>
            <div className="form-meta-row">
              <input
                type="text"
                placeholder="Nombre del formulario"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <textarea
                placeholder="Descripción breve del formulario"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="section-weights-row">
              {sectionOrder.map((sectionType) => (
                <label key={sectionType} className="section-weight-field">
                  <span>{getSectionLabel(sectionType)} (peso)</span>

                  <input
                    type="number"
                    value={sectionWeights[sectionType]}
                    min={0}
                    step={1}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      setSectionWeights(prev => ({
                        ...prev,
                        [sectionType]: Number.isFinite(value)
                          ? Math.min(255, Math.max(0, Math.round(value)))
                          : 0
                      }));
                    }}
                  />

                  <small className="config-help">
                    {getSectionWeightPercentage(sectionType)}% del formulario
                  </small>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="positions-toggle-row">
          <label>
            <input
              type="checkbox"
              checked={positionsAreGlobal}
              onChange={(e) => {
                oldPositions.current.questions = capturePositions('question');
                pendingFlip.current = 'question';
                setPositionsAreGlobal(e.target.checked);
              }}
            />
            Posiciones globales dentro del formulario
          </label>
          <span className="positions-toggle-hint">
            {positionsAreGlobal
              ? 'Las preguntas conservan su orden absoluto dentro del formulario. Los pesos relativos y el % mostrado se calculan sobre todas las preguntas del formulario.'
              : 'Se agrupan por sección y cada sección tiene su propio orden. Los pesos relativos y el % mostrado se calculan sobre las preguntas de cada sección por separado.'}
          </span>
        </div>

        {selectedQuestions.length === 0 ? (
          <div className="empty-selection-hint">Selecciona preguntas en la lista para configurar secciones, orden y dependencias.</div>
        ) : (
          positionsAreGlobal ? (
            selectedQuestions.map((q, index) => renderQuestionConfigRow(q, index, selectedQuestions))
          ) : (
            sectionOrder.map((sectionType, sectionIndex) => {
              const sectionQuestions = questionsBySection[sectionType];
              if (!sectionQuestions || !sectionQuestions.length) return null;
              return (
                <div
                  key={sectionType}
                  ref={(node) => {
                    if (node) {
                      sectionNodeRefs.current.set(sectionType, node);
                    } else {
                      sectionNodeRefs.current.delete(sectionType);
                    }
                  }}
                  className="section-group">
                  <div className="section-group-header">
                    <span>{getSectionLabel(sectionType)}</span>
                    <span className="section-buttons">
                      <button
                        type="button"
                        className="section-move-btn"
                        onClick={() => moveSection(sectionType, 'up')}
                        disabled={sectionIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="section-move-btn"
                        onClick={() => moveSection(sectionType, 'down')}
                        disabled={sectionIndex === sectionOrder.length - 1}
                      >
                        ↓
                      </button>
                    </span>
                  </div>
                  {sectionQuestions.map((q, index) => renderQuestionConfigRow(q, index, sectionQuestions))}
                </div>
              );
            })
          )
        )}
      </div>
    );
  };

  /**
   * Renders the main form content based on current mode.
   * Extracted to replace large ternary: {mode === 'select' ? ( <> ... select JSX ... </> ) : ( <> ... create JSX ... </> )}
   */
  const renderFormModeContent = () => {
    if (mode === 'select') {
      return renderSelectModeContent();
    } else {
      return renderCreateModeContent();
    }
  };

  /**
   * Renders the "select predefined questions" mode content.
   */
  const renderSelectModeContent = () => {
    return (
      <>
        <h3>Selecciona la pregunta a enviar</h3>
        <div className="question-filter-row">
          <input
            type="text"
            placeholder="Busca por nombre"
            value={questionFilterText}
            onChange={(e) => setQuestionFilterText(e.target.value)}
            className="question-filter-input"
          />
          <select
            value={questionFilterType}
            onChange={(e) => setQuestionFilterType(e.target.value)}
            className="question-filter-type-select"
          >
            <option value="all">Todos los tipos</option>
            <option value="text">Texto libre</option>
            <option value="single_choice">Opción única</option>
            <option value="multiple_choice">Múltiple respuesta</option>
            <option value="true_false">Verdadero / Falso</option>
          </select>
        </div>
        <table className="questions-table">
          <tbody>
            {getFilteredQuestions().map(q => (
              <tr key={q.id} className="question-row">
                <td className="q-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIDs.includes(q.id)}
                    onChange={() => toggleQuestion(q.id)}
                  />
                </td>
                <td className="q-text">
                  <div className="q-name-row">
                    <span className="q-name">{q.name}</span>
                    <span className="q-type-badge">{getReadableQuestionType(q.id_question_type)}</span>
                  </div>
                  <div className="q-meta-row">
                    <span className="q-question-preview">{q.question}</span>
                    {hasOptions(q) && q.options.map((opt, idx) => (
                      <span key={idx} className="q-option-chip">
                        <span className="q-option-text">{opt.text}</span>
                        <span className="q-option-weight">
                          <span className="q-weight-label">peso</span> {opt.weight}
                        </span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="q-actions-cell">
                  <div className="q-actions">
                    <button className="q-edit-btn" onClick={() => startEditQuestion(q)} title="Editar">
                      ✎
                    </button>
                    <button className="q-delete-btn" onClick={() => deleteQuestion(q)} title="Eliminar">
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderSelectedQuestionBuilder()}
      </>
    );
  };

  /**
   * Renders the "create questions manually" mode content.
   */
  const renderCreateModeContent = () => {
    const mq = manualQuestion;
    return (
      <>
        <h3>Crear pregunta</h3>
        <div className="manual-questions single">
          <div className="manual-question-row">
            <div className="manual-field">
              <label>Nombre de la pregunta</label>
              <input
                type="text"
                placeholder="Ej: Situación laboral"
                value={mq.name}
                onChange={(e) => setManualQuestion({ ...mq, name: e.target.value })}
                className="manual-question-name-input"
              />
            </div>
            <div className="manual-field">
              <label>Pregunta</label>
              <input
                type="text"
                placeholder="Escribe la pregunta tal como la verá el estudiante..."
                value={mq.question}
                onChange={(e) => setManualQuestion({ ...mq, question: e.target.value })}
                className="manual-question-input"
              />
            </div>
            <div className="manual-field">
              <label>Tipo de respuesta</label>
              <select
                value={mq.type}
                onChange={(e) => {
                  const newOptions = e.target.value === 'true_false'
                    ? [{ text: 'Verdadero', weight: 0 }, { text: 'Falso', weight: 0 }]
                    : (mq.options || []);
                  setManualQuestion({ ...mq, type: /** @type {QuestionType} */ (e.target.value), options: newOptions });
                }}
                className="manual-type-select"
              >
                <option value="text">Texto libre</option>
                <option value="single_choice">Opción única</option>
                <option value="multiple_choice">Múltiple respuesta</option>
                <option value="true_false">Verdadero / Falso</option>
              </select>
            </div>

            {(mq.type !== 'text') && (
              <div className="manual-options-editor">
                {(mq.options || []).map((opt, idx) => (
                  <div key={idx} className="manual-option-row">
                    <input
                      disabled={mq.type === 'true_false'} // disable text editing for true/false options
                      value={opt.text}
                      onChange={(e) => setManualQuestion({
                        ...mq,
                        options: mq.options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o)
                      })}
                      className="option-input"
                      placeholder="Texto de la opción"
                    />
                    <input
                      type="number"
                      min="0"
                      value={opt.weight}
                      onChange={(e) => {
                        const newWeight = Math.max(0, Number(e.target.value) || 0);
                        setManualQuestion({
                          ...mq,
                          options: mq.options.map((o, i) => i === idx ? { ...o, weight: newWeight } : o)
                        });
                      }}
                      className="option-weight-input"
                      placeholder="Peso"
                    />
                    <button
                      onClick={() => setManualQuestion({ ...mq, options: mq.options.filter((_, i) => i !== idx) })}
                      className="remove-option-btn"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {mq.type !== 'true_false' && (
                  <button
                    onClick={() => setManualQuestion({ ...mq, options: [...(mq.options || []), { text: '', weight: 0 }] })}
                    className="add-option-btn"
                  >
                    Agregar opción
                  </button>
                )}
              </div>
            )}

            <div className="manual-question-controls">
              <button className="save-question-btn" onClick={saveManualQuestion}>Guardar pregunta</button>
              <button className="back-to-select-btn" onClick={cancelCreateQuestion}>Volver a seleccionar preguntas</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="formcreator-scope">
      <div className="formcreator-header-section">
        <h1 className="formcreator-title">Crear formulario</h1>
        <span className="formcreator-subtitle">Caracterización de estudiantes</span>
      </div>

      <div className="formcreator-container">
        <div className="formcreator-body">
          <div className="formcreator-questions">

            <div className="mode-switch">
              <button 
                className={getModeButtonClass('select')} 
                onClick={() => setMode('select')}
              >
                Seleccionar preguntas
              </button>
              <button 
                className={getModeButtonClass('create-custom')} 
                onClick={startCreateQuestion}
              >
                Crear preguntas
              </button>
            </div>

            {renderFormModeContent()}
          </div>

          {mode === 'select' && (
            <div className="formcreator-footer">
              <div className="form-footer-row">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                {generatedUrl && (
                  <div className="generated-url-box">
                    <label>URL del formulario para el estudiante:</label>
                    <div className="url-display">
                      <input type="text" readOnly value={generatedUrl} className="url-input" />
                      <Button variant="outlined" onClick={copyUrlToClipboard}>Copiar URL</Button>
                    </div>
                  </div>
                )}
                <Button 
                  variant="contained" 
                  onClick={handleGenerateUrl} 
                  className="send-btn"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generando...' : 'Generar URL del formulario'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormCreator;