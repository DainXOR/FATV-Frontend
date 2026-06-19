import React, { useState, useEffect, useRef } from 'react';
import '../Estilos/FormCreator.css';
import { Button } from '@mui/material';
import FormApi from '../api/FormsApi.js';
import StudentsApi from '../api/StudentsApi.js';
import Swal from 'sweetalert2';

/**
 * @typedef {import("../Models/StudentModels.js").StudentResult} StudentResult
 * @typedef {import("../Models/FormModels.js").FormQuestionResult} FormQuestionResult
 * @typedef {import("../Models/FormModels.js").FormRequest} FormRequest
 * @typedef {import("../Models/FormModels.js").FormQuestionRequest} FormQuestionRequest
 * @typedef {import("../Models/FormModels.js").FormQuestionOption} FormQuestionOption
 */

/**
 * Readable fromat question.
 * @typedef {Object} ReadableQuestion
 * @property {string} id - Unique identifier (client-generated timestamp)
 * @property {string} name - Question name
 * @property {string} question - Question text
 * @property {'text' | 'single_choice' | 'multiple_choice' | 'true_false'} type - Question type
 * @property {FormQuestionOption[]} options - Answer options for choice/multiple questions
 */

/**
 * Configuration for a selected question's answer format.
 * @typedef {Object} ConfiguredQuestion
 * @property {'text' | 'single_choice' | 'multiple_choice' | 'true_false'} type - Question type
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
 * Maps frontend question type to backend ID.
 *
 * @param {'text' | 'single_choice' | 'multiple_choice' | 'true_false'} type - The frontend type ('text', 'single_choice', 'multiple_choice', 'true_false').
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
  const [selectedQuestionIDs, setSelected] = useState(() => questions.map(q => q.id));
  const [questionFilterText, setQuestionFilterText] = useState('');
  const [questionFilterType, setQuestionFilterType] = useState('all');
  const [mode, setMode] = useState(/** @type {'select' | 'create-custom'} */('select')); 
  const [formError, setFormError] = useState(/** @type {string | null} */(null));
  const [formSuccess, setFormSuccess] = useState(/** @type {string | null} */(null));
  const [students, setStudents] = useState(/** @type {LocalStudent[]} */([]));
  const [selectedStudent, setSelectedStudent] = useState(/** @type {LocalStudent | null} */(null));
  const [searchTerm, setSearchTerm] = useState(/** @type {string} */(''));
  const [showSuggestions, setShowSuggestions] = useState(/** @type {boolean} */(false));
  const [generatedUrl, setGeneratedUrl] = useState(/** @type {string | null} */(null));
  const [isGenerating, setIsGenerating] = useState(/** @type {boolean} */(false));
  const suggestionsRef = useRef(/** @type {HTMLDivElement | null} */(null));

  // Single manual question editor (used only in create-custom mode)
  const [manualQuestion, setManualQuestion] = useState(/** @type {ReadableQuestion} */ ({
    id: `m${Date.now()}`,
    name: '',
    question: '',
    type: 'text',
    options: [] 
  }));

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
      console.error(err);
      Swal.fire('Error', err.message || 'No se pudo guardar la pregunta', 'error');
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
      setSelected(prev => prev.filter(id => id !== q.id));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.message || 'No se pudo eliminar la pregunta', 'error');
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

  /**
   * Toggles the selection of a question by its ID.
   *
   * @param {string} id - The ID of the question to toggle.
   */
  const toggleQuestion = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
   * @returns {(ReadableQuestion)[]} The array of question payloads.
   */
  const buildQuestionsPayload = () => {
    return questions.filter(q => selectedQuestionIDs.includes(q.id)).map(q => ({
      id: q.id,
      name: q.name,
      question: q.question,
      type: mapBackendToType(q.id_question_type),
      options: q.options
    }));
  };

  const prepareInputs = () => {
    const questionsPayload = buildQuestionsPayload();

    if (!selectedStudent) {
      const error = new Error('Seleccione un estudiante antes de generar el URL.');
      error.code = 'NO_STUDENT';
      throw error;
    }
    if (!questionsPayload.length) {
      const error = new Error('Agregue al menos una pregunta con texto antes de generar el URL.');
      error.code = 'NO_QUESTIONS';
      throw error;
    }

    return questionsPayload;
  };

  const buildFormPayload = (/** @type {any[]} */ questionsPayload) => {
    // Previously:
    // const formPayload = { ... } from the old code block with questions_info mapping
    return {
      name: `Caracterización para ${selectedStudent?.first_name}`,
      description: 'Diligencia esta caracterización para conocerte mejor',
      date: new Date().toISOString(),
      questions_info: questionsPayload.map((/** @type {{ id: any; }} */ q, /** @type {number} */ index) => ({
        position: index + 1,
        section: 1,
        id_parent_question: '',
        needed_answers: [],
        id_question: q.id,
        optional: false,
      })),
    };
  };

  const submitForm = async (/** @type {(import("../Models/FormModels.js").FormQuestionResult | ReadableQuestion)[]} */ questionsPayload, /** @type {{ name: string; description: string; date: string; questions_info: any; }} */ formPayload) => {
    // Old “create questions + post form” logic in detail is preserved in comments below.
    // The new flow is one-shot for readability.

    // 1. create or update questions (either select or create-custom)
    // if mode === 'create-custom', the original loop sent each question to /forms/questions
    // and built a newQuestionsPayload with returned IDs.

    // 2. submit final form payload via FormApi.create()

    const finalPayload = formPayload;

    const response = await FormApi.create(finalPayload);
    if (!response.ok) {
      const error = new Error(response.error?.message || 'Error al crear formulario');
      error.code = response.status;
      error.details = response.error;
      throw error;
    }

    const newFormId = response.body?.data?.id || response.body?.id;
    if (!newFormId) {
      const error = new Error('El backend no devolvió un ID de formulario.');
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
      const newFormId = await submitForm(questionsPayload, formPayload);

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
      const statusCode = error.status || error.code || 'UNKNOWN';
      const message = error.message || 'Error al generar el formulario';
      const details = error.details || error;

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
    const fetchStudents = async () => {
      try {
        const response = await StudentsApi.getAll();

        if (!response.ok) {
          throw new Error(response.error?.message || 'Error al cargar estudiantes');
        }

        const raw = response.body.data || [];
        const list = (raw || []).map(student => ({
          id: student.id || Math.random().toString(36).slice(2,9),
          number_id: student.number_id || '',
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          phone_number: student.phone_number || '',
          email: student.email || '',
          fullName: `${(student.first_name || '').trim()} ${(student.last_name || '').trim()}`.trim()
        }));
        setStudents(list);
      } catch (err) {
        console.error('Error cargando estudiantes:', err);
        setStudents([]);
      }
    };
    fetchStudents();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (/** @type {{ target: Node | null; }} */ e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==================== HELPER FUNCTIONS FOR CLEANER JSX ====================

  /**
   * Gets the value to display in the student search input.
   * Extracted from: value={selectedStudent ? selectedStudent.fullName : searchTerm}
   */
  const getSearchInputValue = () => {
    if (selectedStudent) {
      return selectedStudent.fullName;
    }
    return searchTerm;
  };

  /**
   * Gets the email to display in the read-only email field.
   * Extracted from: value={selectedStudent ? selectedStudent.email : ''}
   */
  const getSelectedStudentEmail = () => {
    if (selectedStudent) {
      return selectedStudent.email;
    }
    return '';
  };

  /**
   * Gets the correct CSS class for mode button.
   * Extracted from: className={"mode-btn " + (mode === 'select' ? 'active' : '')}
   */
  const getModeButtonClass = (/** @type {string} */ buttonMode) => {
    const baseClass = 'mode-btn';
    const isActive = mode === buttonMode;
    return isActive ? `${baseClass} active` : baseClass;
  };

  /**
   * Renders student suggestions list.
   * Extracted to eliminate complex nested JSX with multiple filter() calls.
   */
  const renderStudentSuggestions = () => {
    const filteredStudents = students.filter(s => {
      const fullName = (s.fullName || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();
      return fullName.includes(search);
    });

    const visibleStudents = filteredStudents.slice(0, 50);
    const hasResults = filteredStudents.length > 0;

    return (
      <ul className="student-suggestions">
        {visibleStudents.map(s => (
          <li 
            key={s.id} 
            onMouseDown={() => { 
              setSelectedStudent(s); 
              setShowSuggestions(false); 
              setSearchTerm(''); 
            }}
          >
            <span className="s-name">{s.fullName || `${s.first_name} ${s.last_name}`}</span>
            <span className="s-email">{s.email}</span>
          </li>
        ))}
        {!hasResults && <li className="no-students">No se encontraron</li>}
      </ul>
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
            <input
              type="text"
              placeholder="Nombre de la pregunta..."
              value={mq.name}
              onChange={(e) => setManualQuestion({ ...mq, name: e.target.value })}
              className="manual-question-name-input"
            />
            <input
              type="text"
              placeholder="Escribe la pregunta..."
              value={mq.question}
              onChange={(e) => setManualQuestion({ ...mq, question: e.target.value })}
              className="manual-question-input"
            />
            <select
              value={mq.type}
              onChange={(e) => {
                const newOptions = e.target.value === 'true_false'
                  ? [{ text: 'Verdadero', weight: 0 }, { text: 'Falso', weight: 0 }]
                  : (mq.options || []);
                setManualQuestion({ ...mq, type: e.target.value, options: newOptions });
              }}
              className="manual-type-select"
            >
              <option value="text">Texto libre</option>
              <option value="single_choice">Opción única</option>
              <option value="multiple_choice">Múltiple respuesta</option>
              <option value="true_false">Verdadero / Falso</option>
            </select>

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

            <div style={{ marginTop: 12 }}>
              <button className="save-question-btn" onClick={saveManualQuestion}>Guardar pregunta</button>
              <button className="back-to-select-btn" onClick={cancelCreateQuestion} style={{ marginLeft: 8 }}>Volver a seleccionar preguntas</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="formcreator-header-section">
        <h1 className="formcreator-title">Crear formulario</h1>
      </div>

      <div className="formcreator-container">
        <div className="formcreator-body">
          <div className="formcreator-questions">
            {mode === 'select' && (
              <div className="student-select-box">
                <label>Estudiante</label>
                <div className="student-row">
                  <div className="student-suggestions-wrapper" ref={suggestionsRef}>
                    <input
                      type="text"
                      className="student-search-input"
                      placeholder="Buscar estudiante por nombre..."
                      value={getSearchInputValue()}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                        setSelectedStudent(null);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && renderStudentSuggestions()}
                  </div>

                  <input
                    type="email"
                    readOnly
                    value={getSelectedStudentEmail()}
                    placeholder="Email del estudiante"
                    className="student-email-input"
                  />
                </div>
              </div>
            )}

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
                  style={{ backgroundColor: '#222D56', color: 'white', fontSize: '20px' }}
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