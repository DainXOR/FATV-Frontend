import React from 'react';
import '../Estilos/Botones.css';

function Botones({ onNavigate, collapsed, activeId, isAdmin = false }) {
  const buttonData = [
    { id: 'register', title: 'Registro de estudiantes', description: 'Registra un nuevo estudiante en el sistema', image: '/registrar.png', alt: 'register' },
    { id: 'edit', title: 'Editar datos', description: 'Actualiza la información de los estudiantes', image: '/editar.png', alt: 'edit' },
    { id: 'support', title: 'Acompañamientos', description: 'Añade nuevos acompañamientos', image: '/acompañar.png', alt: 'support' },
    { id: 'support-history', title: 'Ver acompañamientos', description: 'Métricas y estadísticas por mes', image: '/metricas.png', alt: 'support-history' },
    { id: 'form', title: 'Crear formularios', description: 'Diseña y administra formularios', image: '/formulario.png', alt: 'form' },
    { id: 'send-form', title: 'Enviar caracterización', description: 'Selecciona estudiantes y envía invitaciones', image: '/formulario.png', alt: 'send-form' }
  ];
  if (isAdmin) {
    buttonData.push({ id: 'admin', title: 'Administración', description: 'Cuentas y seguridad', image: '/editar.png', alt: 'admin' });
  }

  return (
    <nav className={`sidebar-nav ${collapsed ? 'collapsed' : ''}`}>
      {buttonData.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-row ${activeId === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          title={collapsed ? item.title : undefined}
        >
          <span className="nav-row-accent" aria-hidden="true" />
          <img src={item.image} className="nav-icon" alt="" aria-hidden="true" />
          <span className="nav-copy">
            <span className="nav-title">{item.title}</span>
            <span className="nav-description">{item.description}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

export default Botones;