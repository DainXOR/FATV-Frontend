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
 */

/**
 * User-created (manually entered) question.
 * @typedef {Object} UserCreatedQuestion
 * @property {string} id - Unique identifier (client-generated timestamp)
 * @property {string} text - Question text
 * @property {'text' | 'single_choice' | 'multiple_choice' | 'true_false'} type - Question type
 * @property {string[]} options - Answer options for choice/multiple questions
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
 * @param {string} type - The frontend type ('text', 'single_choice', 'multiple_choice', 'true_false').
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
  const [mode, setMode] = useState(/** @type {'select' | 'create-custom'} */('select')); 
  const [manualQuestions, setManualQuestions] = useState(/** @type {UserCreatedQuestion[]} */[]);
  const [configuredQuestions, setConfiguredQuestions] = useState(/** @type {Record<string, ConfiguredQuestion>} */({}));
  const [formError, setFormError] = useState(/** @type {string | null} */(null));
  const [formSuccess, setFormSuccess] = useState(/** @type {string | null} */(null));
  const [students, setStudents] = useState(/** @type {LocalStudent[]} */([]));
  const [selectedStudent, setSelectedStudent] = useState(/** @type {LocalStudent | null} */(null));
  const [searchTerm, setSearchTerm] = useState(/** @type {string} */(''));
  const [showSuggestions, setShowSuggestions] = useState(/** @type {boolean} */(false));
  const [generatedUrl, setGeneratedUrl] = useState(/** @type {string | null} */(null));
  const [isGenerating, setIsGenerating] = useState(/** @type {boolean} */(false));
  const suggestionsRef = useRef(/** @type {HTMLDivElement | null} */(null));

  /**
   * Toggles the selection of a question by its ID.
   *
   * @param {string} id - The ID of the question to toggle.
   */
  const toggleQuestion = (id) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!prev.includes(id)) {
        setConfiguredQuestions(cfg => ({ ...cfg, [id]: { type: 'text', options: [] } }));
      }
      if (prev.includes(id)) {
        setConfiguredQuestions(cfg => {
          const copy = { ...cfg };
          delete copy[id];
          return copy;
        });
      }
      return next;
    });
  };

  /**
   * Builds the payload of questions based on the current mode and selections.
   * In 'select' mode: returns questions with configured answer types.
   * In 'create-custom' mode: returns user-created questions.
   *
   * @returns {(FormQuestionResult | UserCreatedQuestion)[]} The array of question payloads.
   */
  const buildQuestionsPayload = () => {
    return mode === 'select'
      ? questions.filter(q => selectedQuestionIDs.includes(q.id)).map(q => ({ 
          id: q.id, 
          text: q.text, 
          type: configuredQuestions[q.id]?.type || q.type, // Verifica aquí
          options: configuredQuestions[q.id]?.options || [] 
        }))
      : manualQuestions.filter(m => (m.text || '').trim()).map((m, idx) => ({ 
          id: m.id || `manual_${idx + 1}`,
          text: m.text, 
          type: m.type || 'text', // Asegúrate de que esto esté configurado correctamente
          options: m.options || [] 
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

  const buildFormPayload = (questionsPayload) => {
    // Previously:
    // const formPayload = { ... } from the old code block with questions_info mapping
    return {
      name: `Caracterización para ${selectedStudent.first_name}`,
      description: 'Diligencia esta caracterización para conocerte mejor',
      date: new Date().toISOString(),
      questions_info: questionsPayload.map((q, index) => ({
        position: index + 1,
        section: 1,
        id_parent_question: '',
        needed_answers: [],
        id_question: q.id,
        optional: false,
      })),
    };
  };

  const submitForm = async (questionsPayload, formPayload) => {
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

  /*
  // Old implementation retained for reference (very detailed steps):
  // - built formPayload
  // - created each question through axios POST to /forms/questions
  // - built oldFormPayload
  // - submitted oldFormPayload via FormApi.create
  // - set generated URL, etc.
  */

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
        // Old axios call (commented for reference)
        /*
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v2/students/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        const raw = response.data?.data || [];
        */
        // New API call
        //StudentsApi.setAuthToken && StudentsApi.setAuthToken(token);
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
        //const token = localStorage.getItem('token');
        // Old axios call (commented for reference)
        /*
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/questions/all`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const list = response.data?.data;
        */
        // New API call
        //FormApi.setAuthToken && FormApi.setAuthToken(token);
        const response = await FormApi.Questions().getAll();

        if (!response.ok) {
          throw new Error(response.error?.message || 'Error al cargar preguntas');
        }

        const list = response.body.data;
        if (!Array.isArray(list)) {
          console.error("El backend NO devolvió una lista en 'data'");
          return;
        }
        const loadedQuestions = list.map(q => ({
          id: q.id,
          text: q.question,             
          name: q.name,
          options: q.options || [],   
          type: mapTypeToBackend(q.id_question_type)
        }));
        setQuestions(loadedQuestions);
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
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <div className="formcreator-header-section">
        <h1 className="formcreator-title">Crear formulario</h1>
      </div>

      <div className="formcreator-container">
        <div className="formcreator-body">
          <div className="formcreator-questions">
            <div className="student-select-box">
              <label>Estudiante</label>
              <div className="student-row">
                <div className="student-suggestions-wrapper" ref={suggestionsRef}>
                  <input
                    type="text"
                    className="student-search-input"
                    placeholder="Buscar estudiante por nombre..."
                    value={selectedStudent ? selectedStudent.fullName : searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                      setSelectedStudent(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {showSuggestions && (
                    <ul className="student-suggestions">
                      {students.filter(s => (s.fullName || '').toLowerCase().includes((searchTerm || '').toLowerCase())).slice(0, 50).map(s => (
                        <li key={s.id} onMouseDown={() => { setSelectedStudent(s); setShowSuggestions(false); setSearchTerm(''); }}>
                          <span className="s-name">{s.fullName || `${s.first_name} ${s.last_name}`}</span>
                          <span className="s-email">{s.email}</span>
                        </li>
                      ))}
                      {students.filter(s => (s.fullName || '').toLowerCase().includes((searchTerm || '').toLowerCase())).length === 0 && (
                        <li className="no-students">No se encontraron</li>
                      )}
                    </ul>
                  )}
                </div>

                <input
                  type="email"
                  readOnly
                  value={selectedStudent ? selectedStudent.email : ''}
                  placeholder="Email del estudiante"
                  className="student-email-input"
                />
              </div>
            </div>

            <div className="mode-switch">
              <button className={"mode-btn " + (mode === 'select' ? 'active' : '')} onClick={() => setMode('select')}>Seleccionar preguntas</button>
              <button className={"mode-btn " + (mode === 'create-custom' ? 'active' : '')} onClick={() => setMode('create-custom')}>Crear preguntas manualmente</button>
            </div>

            {mode === 'select' ? (
              <>
                <h3>Selecciona la pregunta a enviar</h3>
                <table className="questions-table">
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id} className="question-row">
                        <td className="q-checkbox">
                          <input type="checkbox" checked={selectedQuestionIDs.includes(q.id)} onChange={() => toggleQuestion(q.id)} />
                        </td>
                        <td className="q-text">{q.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedQuestionIDs.length > 0 && (
                  <div className="selected-config">
                    <h4>Configurar respuestas para preguntas seleccionadas</h4>
                    {selectedQuestionIDs.map((id) => {
                      const q = questions.find(x => x.id === id) || { id, text: id };
                      const cfg = configuredQuestions[id] || { type: 'text', options: [] };
                      return (
                        <div key={id} className="config-row">
                          <div className="config-question-text">{q.text}</div>
                          <select value={cfg.type} onChange={(e) => setConfiguredQuestions(c => ({ ...c, [id]: { ...c[id], type: e.target.value, options: e.target.value === 'true_false' ? ['Verdadero','Falso'] : (c[id]?.options || []) } }))} className="config-type-select">
     
                            <option value="text">Texto libre</option>
                            <option value="single_choice">Opción única</option>
                            <option value="multiple_choice">Múltiple respuesta</option>
                            <option value="true_false">Verdadero / Falso</option>
                          </select>
                          {(cfg.type === 'single_choice' || cfg.type === 'multiple_choice') && (
                            <div className="options-editor">
                              {(cfg.options || []).map((opt, idx) => (
                                <div key={idx} className="option-row">
                                  <input value={opt} onChange={(e) => setConfiguredQuestions(c => {
                                    const copy = { ...c };
                                    copy[id] = { ...copy[id], options: (copy[id].options || []).map((o, i) => i === idx ? e.target.value : o) };
                                    return copy;
                                  })} className="option-input" />
                                  <button className="remove-option-btn" onClick={() => setConfiguredQuestions(c => {
                                    const copy = { ...c };
                                    copy[id] = { ...copy[id], options: (copy[id].options || []).filter((_, i) => i !== idx) };
                                    return copy;
                                  })}>Eliminar</button>
                                </div>
                              ))}
                              <button className="add-option-btn" onClick={() => setConfiguredQuestions(c => ({ ...c, [id]: { ...c[id], options: [...(c[id]?.options || []), ''] } }))}>Agregar opción</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>Crear preguntas manualmente</h3>
                <div className="manual-questions">
                  {manualQuestions.map((mq, idx) => (
                    <div key={mq.id} className="manual-question-row">
                      <input
                        type="text"
                        placeholder={`Pregunta ${idx + 1}`}
                        value={mq.text}
                        onChange={(e) => {
                          const txt = e.target.value;
                          setManualQuestions(prev => prev.map(p => p.id === mq.id ? { ...p, text: txt } : p));
                        }}
                        className="manual-question-input"
                      />
                      <select value={mq.type} onChange={(e) => setManualQuestions(prev => prev.map(p => p.id === mq.id ? { ...p, type: e.target.value, options: e.target.value === 'true_false' ? ['Verdadero','Falso'] : (p.options || []) } : p))} className="manual-type-select">
                        <option value="text">Texto libre</option>
                        <option value="single_choice">Opción única</option>
                        <option value="multiple_choice">Múltiple respuesta</option>
                        <option value="true_false">Verdadero / Falso</option>
                      </select>
                      {(mq.type === 'single_choice' || mq.type === 'multiple_choice') && (
                        <div className="manual-options-editor">
                          {(mq.options || []).map((opt, i) => (
                            <div key={i} className="manual-option-row">
                              <input value={opt} onChange={(e) => setManualQuestions(prev => prev.map(p => p.id === mq.id ? { ...p, options: p.options.map((o, idx2) => idx2 === i ? e.target.value : o) } : p))} className="option-input" />
                              <button className="remove-option-btn" onClick={() => setManualQuestions(prev => prev.map(p => p.id === mq.id ? { ...p, options: p.options.filter((_, ii) => ii !== i) } : p))}>Eliminar</button>
                            </div>
                          ))}
                          <button className="add-option-btn" onClick={() => setManualQuestions(prev => prev.map(p => p.id === mq.id ? { ...p, options: [...(p.options || []), ''] } : p))}>Agregar opción</button>
                        </div>
                      )}
                      <button className="remove-question-btn" onClick={() => setManualQuestions(prev => prev.filter(p => p.id !== mq.id))}>Eliminar</button>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <button className="add-question-btn" onClick={() => setManualQuestions(prev => [...prev, { id: `m${Date.now()}`, text: '', type: 'text', options: [] }])}>Agregar pregunta</button>
                  </div>
                </div>
              </>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default FormCreator;