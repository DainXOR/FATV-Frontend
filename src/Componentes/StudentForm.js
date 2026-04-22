import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../Estilos/StudentForm.css';

import FormsApi from '../api/FormsApi';

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
        const resForm = await FormsApi.getById(formId);
        if (!resForm.ok) {
          throw new Error(resForm.error.message || 'Error al cargar el formulario');
        }

        const formData = resForm.body.data;
        const resBank = await FormsApi.getAll();
        if (!resBank.ok) {
          throw new Error(resBank.error.message || 'Error al cargar el banco de preguntas');
        }

        const bankList = resBank.body.data;
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
      
      await FormsApi.create(payload);
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
