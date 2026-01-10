import React, { useState, useEffect, useRef } from 'react';
import '../Estilos/FormCreator.css';
import { Button } from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';

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
    }
  };

const FormCreator = ({ onBack }) => {
  const [questions, setQuestions] = useState([]); 
  const [selected, setSelected] = useState(() => questions.map(q => q.id));
  const [mode, setMode] = useState('select'); 
  const [manualQuestions, setManualQuestions] = useState([]);
  const [configuredQuestions, setConfiguredQuestions] = useState({});
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const suggestionsRef = useRef(null);

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

const buildQuestionsPayload = () => {
    return mode === 'select'
      ? questions.filter(q => selected.includes(q.id)).map(q => ({ 
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

  const handleGenerateUrl = async () => {
    setFormError(null);
    setFormSuccess(null);
    setGeneratedUrl(null);
    setIsGenerating(true);

    let questionsPayload = buildQuestionsPayload();

    if (!selectedStudent) {
        setFormError('Seleccione un estudiante antes de generar el URL.');
        setIsGenerating(false);
        return;
    }
    if (!questionsPayload || questionsPayload.length === 0) {
        setFormError('Agregue al menos una pregunta con texto antes de generar el URL.');
        setIsGenerating(false);
        return;
    }

   const formPayload = {
        name: "Caracterización para " + selectedStudent.first_name,
        description: "Diligencia esta caracterización para conocerte mejor",
        date: new Date().toISOString(),
        questions_info: questionsPayload.map((q, index) => {
            console.log('Tipo de pregunta:', q.type); // Agrega este log para verificar el tipo
            return {
                position: index + 1,
                section: 1,
                id_parent_question: "",
                needed_answers: [],
                id_question: q.id, 
                optional: false
            };
        })
    };

    console.log('Enviando formulario al backend:', formPayload);

    try {
        const token = localStorage.getItem('token');

        if (mode === 'manual') {
            const newQuestionsWithIds = [];

            for (const q of questionsPayload) {
                // Validar opciones antes de crear el payload
                if ((q.type === 'single_choice' || q.type === 'multiple_choice') && (!q.options || q.options.length === 0)) {
                    throw new Error(`Las preguntas de tipo ${q.type} deben tener al menos una opción.`);
                }

                const questionBankPayload = {
                    id_question_type: mapTypeToBackend(q.type),
                    name: q.text.substring(0, 50), 
                    question: q.text,
                    options: (q.options || []).map(String),
                };

                console.log('PAYLOAD A /questions:', questionBankPayload);
                console.log('id_question_type:', questionBankPayload.id_question_type); // Verifica el ID de tipo

                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/questions/`,
                    questionBankPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const newId = response.data?.data?.id || response.data?.id;

                if (!newId) {
                    throw new Error(`El backend no devolvió un ID para la pregunta: ${q.text}`);
                }
                newQuestionsWithIds.push({
                    ...q,
                    id: newId, 
                    type: mapTypeToBackend(q.type),
                });
            }

            questionsPayload = newQuestionsWithIds;
        }

        const formPayload = {
            name: "Caracterización para " + selectedStudent.first_name,
            description: "Diligencia esta caracterización para conocerte mejor",
            date: new Date().toISOString(),
            questions_info: questionsPayload.map((q, index) => ({
                position: index + 1,
                section: 1,
                id_parent_question: "",
                needed_answers: [],
                id_question: q.id,
                text: q.text,
                type: mapTypeToBackend(q.type), 
                options: q.options, 
                optional: false
            }))
        };

        console.log('Enviando formulario al backend:', formPayload);

        // Enviar al backend para crear el formulario
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/`,
            formPayload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Respuesta del backend:', response.data);

        const formId = response.data?.data?.id || response.data?.id;

        if (!formId) {
            throw new Error('El backend no devolvió un ID de formulario');
        }

        const baseUrl = window.location.origin;
        const studentFormUrl = `${baseUrl}/student-form/${formId}`;

        setGeneratedUrl(studentFormUrl);
        setFormSuccess('URL generada correctamente. Comparte este enlace con el estudiante.');

        Swal.fire({
            title: '¡Formulario creado!',
            text: 'El formulario ha sido generado exitosamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#673ab7'
        });

    } catch (error) {
        console.error('Error al generar URL:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Error al crear el formulario';
        setFormError(errorMsg);

        Swal.fire({
            title: 'Error',
            text: errorMsg,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#d33'
        });
    } finally {
        setIsGenerating(false);
    }
};

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
        const list = (raw || []).map(student => ({
          id: student.id || student._id || student.number_id || Math.random().toString(36).slice(2,9),
          number_id: student.number_id || student.id || student._id || '',
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
        const token = localStorage.getItem('token');

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/questions/all`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log("RESPUESTA COMPLETA DEL BACK:", response.data);

        const list = response.data?.data;

        if (!Array.isArray(list)) {
          console.error("El backend NO devolvió una lista en 'data'");
          return;
        }

        const loaded = list.map(q => ({
          id: q.id,
          text: q.question,             
          name: q.name,
          options: q.options || [],   
          type: mapTypeToBackend(q.id_question_type)
        }));

        setQuestions(loaded);

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
              <button className={"mode-btn " + (mode === 'manual' ? 'active' : '')} onClick={() => setMode('manual')}>Crear preguntas manualmente</button>
            </div>

            {mode === 'select' ? (
              <>
                <h3>Selecciona la pregunta a enviar</h3>
                <table className="questions-table">
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id} className="question-row">
                        <td className="q-checkbox">
                          <input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggleQuestion(q.id)} />
                        </td>
                        <td className="q-text">{q.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selected.length > 0 && (
                  <div className="selected-config">
                    <h4>Configurar respuestas para preguntas seleccionadas</h4>
                    {selected.map((id) => {
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