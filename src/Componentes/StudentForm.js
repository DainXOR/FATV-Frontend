import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../Estilos/StudentForm.css';

const StudentForm = ({ formId }) => {
  const [formConfig, setFormConfig] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    number_id: '',
    first_name: '',
    last_name: '',
    email: ''
  });

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const loadForm = async () => {
      try {

        const resForm = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/${formId}`
        );

        const formData = resForm.data?.data || resForm.data;


        const resBank = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/questions/all`
        );
        const bankList = resBank.data?.data || resBank.data || [];


        console.log('DEBUG bankList[0]:', bankList[0]);

        const bankMap = new Map();
        bankList.forEach(b => {
          const possibleIds = [
            b.id,
            b._id,
            (b._id && b._id.$oid),
            b._id_str,
            b._id?.toString && b._id.toString(),
            b.id_question,
            b.idQuestion
          ].filter(Boolean).map(v => String(v));
          possibleIds.forEach(pid => bankMap.set(pid, b));
        });
        console.log('DEBUG bankMap keys (sample):', Array.from(bankMap.keys()).slice(0,30));
        const rawList = formData?.questions_info
          || formData?.questions
          || formData?.questionsInfo
          || [];
        console.log('DEBUG rawList:', rawList);

        
        const formattedQuestions = await Promise.all(
          rawList.map(async (qi = {}, idx) => {
            const refRaw = qi.id_question ?? qi.id ?? qi._id ?? qi.idQuestion ?? null;
            let refId = refRaw;
            if (refId && typeof refId === 'object') {
              refId = refId.id || refId._id || refId.$oid || refId.toString?.() || null;
            }
            refId = refId ? String(refId) : null;

            let bankEntry = refId ? bankMap.get(refId) : undefined;

            if (!bankEntry && refId) {
              try {
                const resQ = await axios.get(
                  `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/questions/${refId}`
                );
                const qData = resQ.data?.data || resQ.data;
                if (qData) {
                  bankEntry = qData;
                  console.log(`DEBUG: fetched question ${refId} from backend`, qData);
                }
              } catch (err) {
                console.warn(`DEBUG: no se pudo obtener pregunta ${refId} individualmente`, err?.message || err);
              }
            }

            const id = refId || qi.id || qi._id || `q-${idx}-${Date.now()}`;

            const text = (qi.text || qi.question || qi.title || qi.name || bankEntry?.text || bankEntry?.question || bankEntry?.title || '').toString().trim();

            const rawType = qi.type ?? qi.question_type ?? qi.type_name ?? qi.type_id ?? bankEntry?.type ?? bankEntry?.question_type ?? '';

            const rawOptions = qi.options || qi.answers || qi.choices || qi.options_list || bankEntry?.options || bankEntry?.choices || [];
            // Normalizar opciones como array de strings
            let options = Array.isArray(rawOptions)
              ? rawOptions.map(o => {
                  if (typeof o === 'string') return o;
                  if (o === null || o === undefined) return String(o);
                  return String(o.label || o.text || o.value || o.name || o);
                }).filter(Boolean)
              : [];

            if ((options.length === 0) && bankEntry) {
              const bankOpts = Array.isArray(bankEntry.options) ? bankEntry.options
                                : Array.isArray(bankEntry.choices) ? bankEntry.choices
                                : null;
              if (bankOpts && bankOpts.length) {
                options = bankOpts.map(o => (typeof o === 'string' ? o : String(o.label || o.text || o.value || o.name || o)));
              }
            }

            // Determinar tipo: 1=text, 2=single, 3=multiple, 4=true_false
let questionType = 1; // Inicialmente es Texto
            
            // Opciones estandarizadas de V/F para comparación
            const isTrueFalseSet = (options.length === 2 && options.some(o => o.toLowerCase().includes('verdadero')) && options.some(o => o.toLowerCase().includes('falso')));

            // 1. Determinar por tipo explícito (si existe)
            if (typeof rawType === 'number') {
              questionType = rawType;
            } else if (typeof rawType === 'string' && rawType.trim() !== '') {
              const t = rawType.toLowerCase();
              if (t.includes('multiple') || t.includes('checkbox') || t.includes('multi')) questionType = 3;
              else if (t.includes('true_false') || t.includes('boolean') || t.includes('truefalse') || t.includes('tf') || t.includes('verdadero') || t.includes('falso')) questionType = 4;
              else if (t.includes('radio') || t.includes('single') || t.includes('unique') || t.includes('one')) questionType = 2;
              else if (t.includes('text') || t.includes('string') || t.includes('input')) questionType = 1;
            } 
            
            if (questionType === 1 || questionType === 2) { 
                 if (options.length > 2) {
                    questionType = 3; // Múltiple
                 } else if (isTrueFalseSet) {
                    questionType = 4; 
                    options = ['Verdadero', 'Falso']; 
                 } else if (options.length === 2 || options.length === 1) {
                    questionType = 2; 
                 } else {
                    questionType = 1; 
                 }
            }
            
            if (questionType === 4 && options.length === 0) {
              options = ['Verdadero', 'Falso'];
            }

            if (!text || text.length === 0) {
              console.warn(`Pregunta sin texto en index ${idx}, refId=${refId}`, { qi, bankEntry });
            }

            return {
              id,
              text: text || 'Pregunta sin texto',
              type: questionType,
              options,
              position: qi.position ?? qi.order ?? (idx + 1)
            };
          })
        );

        const finalQuestions = formattedQuestions
          .filter(Boolean)
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        console.log('DEBUG formattedQuestions:', finalQuestions);

        setFormConfig({
          ...formData,
          questions: finalQuestions
        });

        const initial = {};
        finalQuestions.forEach(q => {
          if (q.type === 3) initial[q.id] = [];       
          else initial[q.id] = "";                     
        });
        setAnswers(initial);

      } catch (err) {
        Swal.fire("Error", "No se pudo cargar el formulario", "error");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers(prev => {
      if (type === 3) {
        const exists = prev[questionId].includes(value);
        return {
          ...prev,
          [questionId]: exists
            ? prev[questionId].filter(v => v !== value)
            : [...prev[questionId], value]
        };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const validate = () => {
    if (!studentInfo.number_id.trim())
      return Swal.fire("Falta información", "Por favor ingresa tu cédula", "warning");

    if (!studentInfo.first_name.trim())
      return Swal.fire("Falta información", "Por favor ingresa tu nombre", "warning");

    if (!studentInfo.last_name.trim())
      return Swal.fire("Falta información", "Por favor ingresa tu apellido", "warning");

    if (!studentInfo.email.trim())
      return Swal.fire("Falta información", "Por favor ingresa tu correo", "warning");

    const empty = formConfig.questions.some(q => {
      const v = answers[q.id];
      if (q.type === 3) return v.length === 0;
      return !v || v === "";
    });

    if (empty) {
      return Swal.fire("Formulario incompleto", "Responde todas las preguntas", "warning");
    }

    return true;
  };


  const submit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        id_form: formId,
        student: studentInfo,
        answers: formConfig.questions.map(q => ({
          id_question: q.id,
          answers: Array.isArray(answers[q.id]) ? answers[q.id] : [answers[q.id]]
        }))
      };

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/v2/forms/answers/`,
        payload
      );

      Swal.fire("¡Listo!", "El formulario fue enviado con éxito", "success");

    } catch (err) {
      Swal.fire("Error", "No se pudo enviar el formulario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q, index) => {
    const val = answers[q.id];

    return (
      <div key={q.id} className="gform-question-card">
        <div className="gform-question-title">
          {index + 1}. {q.text}
          <span className="gform-required">*</span>
        </div>

        {/* tipo 1: texto */}
        {q.type === 1 && (
          <input
            type="text"
            className="gform-text-input"
            value={val}
            onChange={e => handleAnswerChange(q.id, e.target.value, q.type)}
          />
        )}

        {/* tipo 2: opción única */}
        {q.type === 2 && (
          <div className="gform-options">
            {q.options.map((op, i) => (
              <label key={i} className="gform-radio-option">
                <input
                  type="radio"
                  name={q.id}
                  value={op}
                  checked={val === op}
                  onChange={e => handleAnswerChange(q.id, e.target.value, q.type)}
                />
                {op}
              </label>
            ))}
          </div>
        )}

        {/* tipo 3: múltiple */}
        {q.type === 3 && (
          <div className="gform-options">
            {q.options.map((op, i) => (
              <label key={i} className="gform-checkbox-option">
                <input
                  type="checkbox"
                  value={op}
                  checked={val.includes(op)}
                  onChange={e => handleAnswerChange(q.id, e.target.value, q.type)}
                />
                {op}
              </label>
            ))}
          </div>
        )}

        {/* tipo 4: verdadero/falso */}
        {q.type === 4 && (
          <div className="gform-options">
            {["Verdadero", "Falso"].map((op, i) => (
              <label key={i} className="gform-radio-option">
                <input
                  type="radio"
                  name={q.id}
                  value={op}
                  checked={val === op}
                  onChange={e => handleAnswerChange(q.id, e.target.value, q.type)}
                />
                {op}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading || !formConfig) {

    return <div className="gform-loading">Cargando...</div>; 
  }

 return (
    <div className="gform-container">
      <div className="gform-header">
        <h1 className="gform-title">{formConfig?.name}</h1>
        <p className="gform-description">{formConfig?.description}</p>
      </div>

      <div className="gform-section">
        <h2 className="gform-section-title">Información del estudiante</h2>

        {/* Campos de estudiante */}
        <div className="gform-field">
          <label className="gform-label">Cédula <span className="gform-required">*</span></label>
          <input
            type="text"
            className="gform-input"
            value={studentInfo.number_id}
            onChange={e => setStudentInfo({ ...studentInfo, number_id: e.target.value })}
          />
        </div>

        <div className="gform-field">
          <label className="gform-label">Nombres <span className="gform-required">*</span></label>
          <input
            type="text"
            className="gform-input"
            value={studentInfo.first_name}
            onChange={e => setStudentInfo({ ...studentInfo, first_name: e.target.value })}
          />
        </div>

        <div className="gform-field">
          <label className="gform-label">Apellidos <span className="gform-required">*</span></label>
          <input
            type="text"
            className="gform-input"
            value={studentInfo.last_name}
            onChange={e => setStudentInfo({ ...studentInfo, last_name: e.target.value })}
          />
        </div>

        <div className="gform-field">
          <label className="gform-label">Correo electrónico <span className="gform-required">*</span></label>
          <input
            type="email"
            className="gform-input"
            value={studentInfo.email}
            onChange={e => setStudentInfo({ ...studentInfo, email: e.target.value })}
          />
        </div>
      </div>

      {/* RENDERIZADO DE PREGUNTAS CON OPCIONES */}
      {formConfig.questions.map((q, index) => renderQuestion(q, index))}

      <div className="gform-footer">
        <button
          className="gform-submit-btn"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
};

export default StudentForm;
