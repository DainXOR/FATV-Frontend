import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiClient from '../api/ApiClient';
import FormsApi from '../api/FormsApi';
import StudentsApi from '../api/StudentsApi';
import Swal from 'sweetalert2';

const panelStyle = { border: '1px solid #d8dee8', borderRadius: 12, padding: 20, marginBottom: 20, background: '#fff' };
const buttonStyle = { padding: '9px 14px', borderRadius: 7, border: '1px solid #c5ccd6', cursor: 'pointer' };
const messageFrom = (result, fallback) => result?.error?.details?.error || result?.error?.message || fallback;

const SendFormPage = () => {
  const [forms, setForms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [search, setSearch] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadInvitations = useCallback(async (formId) => {
    if (!formId) {
      setInvitations([]);
      return;
    }
    const result = await ApiClient.get('form-invitations', { queryParams: { form_id: formId } });
    if (!result.ok) throw new Error(messageFrom(result, 'No se pudieron cargar las invitaciones.'));
    setInvitations(result.body.invitations || []);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (!(await ApiClient.connect())) throw new Error('No se pudo conectar con el servidor.');
        const [formResult, studentResult] = await Promise.all([FormsApi.getAll(), StudentsApi.getAll()]);
        if (!formResult.ok) throw new Error(messageFrom(formResult, 'No se pudieron cargar los formularios.'));
        if (!studentResult.ok && studentResult.status !== 404) throw new Error(messageFrom(studentResult, 'No se pudieron cargar los estudiantes.'));
        if (!active) return;
        const loadedForms = Array.isArray(formResult.body?.data) ? formResult.body.data : [];
        const loadedStudents = Array.isArray(studentResult.body?.data) ? studentResult.body.data : [];
        setForms(loadedForms);
        setStudents(loadedStudents);
        if (loadedForms.length) setSelectedFormId(loadedForms[0].id);
      } catch (caught) {
        if (active) setError(caught.message || 'No se pudo cargar la información.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedFormId) {
      setInvitations([]);
      return undefined;
    }
    loadInvitations(selectedFormId).catch(caught => {
      if (active) setError(caught.message || 'No se pudieron cargar las invitaciones.');
    });
    return () => { active = false; };
  }, [selectedFormId, loadInvitations]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return students.filter(student => {
      const name = `${student.first_name || ''} ${student.last_name || ''}`;
      const email = student.institution_email || student.email || student.personal_email || '';
      const haystack = `${name} ${email} ${student.number_id || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [students, search]);

  const toggleStudent = (id) => setSelectedStudentIds(current =>
    current.includes(id) ? current.filter(item => item !== id) : [...current, id]
  );

  const toggleVisibleStudents = () => {
    const visibleIds = filteredStudents.map(student => student.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStudentIds.includes(id));
    setSelectedStudentIds(current => allSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]
    );
  };

  const sendInvitations = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const days = Number(expiryDays);
    if (!selectedFormId) {
      await Swal.fire({ icon: 'error', title: 'Selecciona un formulario', text: 'Debes elegir el formulario que se enviará.' });
      return;
    }
    if (!selectedStudentIds.length) {
      await Swal.fire({ icon: 'error', title: 'No hay estudiantes seleccionados', text: 'Selecciona al menos un estudiante para continuar.' });
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      await Swal.fire({ icon: 'error', title: 'Vigencia no válida', text: 'La vigencia debe estar entre 1 y 30 días.' });
      return;
    }

    const formName = forms.find(form => form.id === selectedFormId)?.name || 'Formulario seleccionado';
    const confirmation = await Swal.fire({
      title: '¿Enviar las invitaciones?',
      text: `Se procesarán ${selectedStudentIds.length} invitación(es) para "${formName}". Los enlaces vencerán en ${days} día(s).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!confirmation.isConfirmed) return;

    setBusy(true);
    try {
      const result = await ApiClient.post('form-invitations', {
        body: {
          form_id: selectedFormId,
          student_ids: selectedStudentIds,
          expires_at: new Date(Date.now() + days * 86400000).toISOString(),
        },
      });
      if (!result.ok) throw new Error(messageFrom(result, 'No se pudieron procesar las invitaciones.'));
      const sent = result.body.sent || 0;
      const failed = result.body.failed || 0;
      setNotice(`Invitaciones enviadas: ${sent}. No procesadas: ${failed}.`);
      setSelectedStudentIds([]);
      await loadInvitations(selectedFormId);
      await Swal.fire({
        icon: failed > 0 ? 'warning' : 'success',
        title: failed > 0 ? 'Proceso completado con advertencias' : 'Invitaciones procesadas',
        html: `<p>Enviadas: <strong>${sent}</strong></p><p>No procesadas: <strong>${failed}</strong></p>`,
        confirmButtonText: 'Aceptar',
      });
    } catch (caught) {
      const message = caught.message || 'No se pudieron procesar las invitaciones.';
      setError(message);
      await Swal.fire({ icon: 'error', title: 'No se pudieron enviar las invitaciones', text: message, confirmButtonText: 'Cerrar' });
    } finally {
      setBusy(false);
    }
  };

  const revokeInvitation = async (invitationId) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const result = await ApiClient.delete('form-invitations', { pathParams: [invitationId] });
      if (!result.ok) throw new Error(messageFrom(result, 'No se pudo revocar la invitación.'));
      setNotice('Invitación revocada. El enlace ya no podrá utilizarse.');
      await loadInvitations(selectedFormId);
    } catch (caught) {
      setError(caught.message || 'No se pudo revocar la invitación.');
    } finally {
      setBusy(false);
    }
  };

  const studentLabel = (id) => {
    const student = students.find(item => item.id === id);
    return student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || id : id;
  };

  if (loading) return <div style={{ padding: 24 }} role="status">Cargando formularios y estudiantes…</div>;

  return (
    <main style={{ padding: 24, maxWidth: 1100, color: '#202938' }}>
      <h2>Enviar caracterización</h2>
      <p>Selecciona un formulario guardado y los estudiantes que deben recibir su enlace individual.</p>
      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#167044' }}>{notice}</p>}

      <section style={panelStyle}>
        <form onSubmit={sendInvitations}>
          <label htmlFor="send-form-select" style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
            Formulario
            <select id="send-form-select" required value={selectedFormId}
              onChange={event => { setSelectedFormId(event.target.value); setSelectedStudentIds([]); setError(''); }}
              style={{ padding: 10, maxWidth: 650 }}>
              <option value="">Selecciona un formulario</option>
              {forms.map(form => <option key={form.id} value={form.id}>{form.name || 'Formulario sin nombre'}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', marginBottom: 12 }}>
            <label style={{ display: 'grid', gap: 6, flex: '1 1 260px' }}>
              Buscar estudiantes
              <input value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Nombre, correo o identificación" style={{ padding: 10 }} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              Vigencia del enlace
              <select value={expiryDays} onChange={event => setExpiryDays(event.target.value)} style={{ padding: 10 }}>
                {[1, 3, 7, 14, 30].map(days => <option key={days} value={days}>{days} día(s)</option>)}
              </select>
            </label>
            <button type="button" style={buttonStyle} onClick={toggleVisibleStudents} disabled={!filteredStudents.length}>
              Seleccionar / quitar visibles
            </button>
          </div>

          <div style={{ border: '1px solid #e0e5ec', borderRadius: 8, maxHeight: 340, overflow: 'auto' }}>
            {filteredStudents.length === 0 ? <p style={{ padding: 14 }}>No hay estudiantes que coincidan con la búsqueda.</p> :
              filteredStudents.map(student => {
                const email = student.institution_email || student.email || student.personal_email || 'Sin correo';
                return (
                  <label key={student.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderBottom: '1px solid #edf0f4' }}>
                    <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                    <span style={{ flex: 1 }}>
                      <strong>{student.first_name} {student.last_name}</strong>
                      <span style={{ display: 'block', fontSize: 13, color: '#586579' }}>{email} · {student.number_id || 'Sin identificación'}</span>
                    </span>
                  </label>
                );
              })}
          </div>
          <p>{selectedStudentIds.length} estudiante(s) seleccionado(s).</p>
          <button type="submit" style={{ ...buttonStyle, background: '#145da0', color: '#fff', borderColor: '#145da0' }}
            disabled={busy || !selectedFormId || !selectedStudentIds.length}>
            {busy ? 'Procesando…' : 'Enviar invitaciones por correo'}
          </button>
        </form>
        <p style={{ fontSize: 13, color: '#586579', marginTop: 12 }}>
          Cada estudiante recibe un enlace individual, con vencimiento y un solo envío permitido. El envío requiere que SMTP esté configurado en el servidor.
        </p>
      </section>

      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <h3>Estado de las invitaciones</h3>
          <button type="button" style={buttonStyle} disabled={busy || !selectedFormId}
            onClick={() => loadInvitations(selectedFormId).catch(caught => setError(caught.message))}>Actualizar</button>
        </div>
        {!selectedFormId ? <p>Selecciona un formulario para ver sus invitaciones.</p> : invitations.length === 0 ?
          <p>Aún no hay invitaciones para este formulario.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th align="left">Estudiante</th><th align="left">Vencimiento</th><th align="left">Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {invitations.map(invitation => (
                    <tr key={invitation.id} style={{ borderTop: '1px solid #e0e5ec' }}>
                      <td style={{ padding: 10 }}>{studentLabel(invitation.student_id)}</td>
                      <td style={{ padding: 10 }}>{new Date(invitation.expires_at).toLocaleString('es-CO')}</td>
                      <td style={{ padding: 10 }}>{invitation.status}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        {invitation.status === 'pending' && <button type="button" style={buttonStyle}
                          disabled={busy} onClick={() => revokeInvitation(invitation.id)}>Revocar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </main>
  );
};

export default SendFormPage;
