import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../Estilos/StudentForm.css';

import FormsApi from '../api/FormsApi';

/**
 * @typedef {import("../Models/FormModels.js").FormResult} FormResult
 * @typedef {import("../Models/FormModels.js").QuestionInfo} QuestionInfo
 * @typedef {import("../Models/FormModels.js").FormQuestionResult} FormQuestionResult
 * @typedef {import("../Models/FormModels.js").FormQuestionTypeResult} FormQuestionTypeResult
 * @typedef {import("../Models/FormModels.js").FormAnswerRequest} FormAnswerRequest
 * @typedef {import("../Models/FormModels.js").Answers} Answers
 */

/** Known question type names, as stored in db. */
const QUESTION_TYPE = {
  TEXT: 'abierta',
  MULTIPLE_CHOICE: 'opcion multiple',
  SINGLE_CHOICE: 'opcion unica',
  BOOLEAN: 'verdadero o falso',
};

/**
 * A question merged with its resolved type name, ready to render.
 * @typedef {Object} RenderableQuestion
 * @property {string} id_question
 * @property {number} position
 * @property {boolean} optional
 * @property {string} question
 * @property {import("../Models/FormModels.js").FormQuestionOption[]} options
 * @property {string} type_name
 */

const StudentForm = ({ formId }) => {
  const [formConfig, setFormConfig] = useState(/** @type {FormResult | null} */(null));
  const [questions, setQuestions] = useState(/** @type {RenderableQuestion[]} */([]));

  const [answers, setAnswers] = useState(/** @type {Answers} */({}));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const resForm = await FormsApi.getById(formId);
        if (!resForm.ok) {
          throw new Error(resForm.error.message || 'Error al cargar el formulario');
        }
        const form = resForm.body.data;

        const resTypes = await FormsApi.Questions().Types().getAll();
        if (!resTypes.ok) {
          throw new Error(resTypes.error.message || 'Error al cargar los tipos de pregunta');
        }
        /** @type {Map<string, FormQuestionTypeResult>} */
        const typesById = new Map(resTypes.body.data.map(t => [t.id, t]));

        /** @type {QuestionInfo[]} */
        const questionInfos = Object.values(form.sections).flat();

        const questionResults = await Promise.all(
          questionInfos.map(qi => FormsApi.Questions().getById(qi.id_question))
        );

        /** @type {RenderableQuestion[]} */
        const renderable = questionInfos.map((qi, i) => {
          const res = questionResults[i];
          if (!res.ok) {
            throw new Error(res.error.message || 'Error al cargar una pregunta');
          }
          /** @type {FormQuestionResult} */
          const q = res.body.data;
          const type = typesById.get(q.id_question_type);

          return {
            id_question: qi.id_question,
            position: qi.position,
            optional: qi.optional,
            question: q.question,
            options: q.options,
            type_name: type?.name ?? '',
          };
        });

        renderable.sort((a, b) => a.position - b.position);

        const initialAnswers = /** @type {Answers} */({});
        renderable.forEach(q => {
          initialAnswers[q.id_question] = [];
        });

        setFormConfig(form);
        setQuestions(renderable);
        setAnswers(initialAnswers);
      } catch (err) {
        Swal.fire("Error", "No se pudo cargar el formulario", "error");
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [formId]);

  /**
   * @param {string} questionId
   * @param {string} value
   * @param {string} typeName
   */
  const handleAnswerChange = (questionId, value, typeName) => {
    setAnswers(prev => {
      if (typeName === QUESTION_TYPE.MULTIPLE_CHOICE) {
        const exists = prev[questionId].includes(value);
        return {
          ...prev,
          [questionId]: exists
            ? prev[questionId].filter(v => v !== value)
            : [...prev[questionId], value]
        };
      }
      return { ...prev, [questionId]: [value] };
    });
  };

  const validate = () => {
    const empty = questions.some(q => {
      if (q.optional) return false;
      const v = answers[q.id_question];
      return !v || v.length === 0;
    });

    if (empty) {
      Swal.fire("Formulario incompleto", "Responde todas las preguntas", "warning");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      /** @type {FormAnswerRequest} */
      const payload = {
        id_form: formId,
        answers,
      };

      const res = await FormsApi.Answers().create(payload);
      if (!res.ok) {
        throw new Error(res.error.message || 'Error al enviar el formulario');
      }
      Swal.fire("¡Listo!", "El formulario fue enviado con éxito", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo enviar el formulario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * @param {RenderableQuestion} q
   * @param {number} index
   */
  const renderQuestion = (q, index) => {
    const val = answers[q.id_question] ?? [];

    return (
      <div key={q.id_question} className="gform-question-card">
        <div className="gform-question-title">
          {index + 1}. {q.question}
          {!q.optional && <span className="gform-required">*</span>}
        </div>

        {q.type_name === QUESTION_TYPE.TEXT && (
          <input
            type="text"
            className="gform-text-input"
            value={val[0] ?? ''}
            onChange={e => handleAnswerChange(q.id_question, e.target.value, q.type_name)}
          />
        )}

        {q.type_name === QUESTION_TYPE.SINGLE_CHOICE && (
          <div className="gform-options">
            {q.options.map((op, i) => (
              <label key={i} className="gform-radio-option">
                <input
                  type="radio"
                  name={q.id_question}
                  value={op.text}
                  checked={val[0] === op.text}
                  onChange={e => handleAnswerChange(q.id_question, e.target.value, q.type_name)}
                />
                {op.text}
              </label>
            ))}
          </div>
        )}

        {q.type_name === QUESTION_TYPE.MULTIPLE_CHOICE && (
          <div className="gform-options">
            {q.options.map((op, i) => (
              <label key={i} className="gform-checkbox-option">
                <input
                  type="checkbox"
                  value={op.text}
                  checked={val.includes(op.text)}
                  onChange={e => handleAnswerChange(q.id_question, e.target.value, q.type_name)}
                />
                {op.text}
              </label>
            ))}
          </div>
        )}

        {q.type_name === QUESTION_TYPE.BOOLEAN && (
          <div className="gform-options">
            {["Verdadero", "Falso"].map((op, i) => (
              <label key={i} className="gform-radio-option">
                <input
                  type="radio"
                  name={q.id_question}
                  value={op}
                  checked={val[0] === op}
                  onChange={e => handleAnswerChange(q.id_question, e.target.value, q.type_name)}
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
        <h1 className="gform-title">{formConfig.name}</h1>
        <p className="gform-description">{formConfig.description}</p>
      </div>

      {questions.map((q, index) => renderQuestion(q, index))}

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