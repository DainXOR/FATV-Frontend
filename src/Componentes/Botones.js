import React from 'react';
import { Button } from '@mui/material';
import '../Estilos/Botones.css';

function Botones({ onNavigate }) {
  const buttonData = [
    {
      id: 'register',
      title: 'Registro de estudiantes',
      buttonText: 'Registrar datos',
      image: 'registrar.png',
      alt: 'register'
    },
    {
      id: 'edit',
      title: 'Editar datos',
      description: 'Edita o actualiza la información de los estudiantes',
      buttonText: 'Editar datos',
      image: 'editar.png',
      alt: 'edit'
    },
    {
      id: 'support',
      title: 'Acompañamientos',
      description: 'Añade nuevos acompañamientos',
      buttonText: 'Añadir acompañamiento',
      image: 'acompañar.png',
      alt: 'support'
    },
    {
      id: 'support-history',
      title: 'Visualiza acompañamientos',
      description: 'Consulta métricas y estadísticas de los acompañamientos realizados por mes',
      buttonText: 'Acompañamientos',
      image: 'metricas.png',
      alt: 'support-history'
    },
    {
      id: 'form',
      title: 'Envíar caracterización',
      description: 'Crea y envía formularios de caracterización a estudiantes en riesgo de deserción',
      buttonText: 'Crear formulario',
      image: 'formulario.png',
      alt: 'form'
    }
  ];

  return (
      <div className="button-container">
        {buttonData.map((item) => (
          <div key={item.id} className="button-item">
            <img src={item.image} className="images" alt={item.alt} />
            <h3 className="button-title">{item.title}</h3>
            <p className="button-description">{item.description}</p>
            <Button
              className="button"
              variant="contained"
              onClick={() => onNavigate(item.id)}
              sx={{
                backgroundColor: '#7C76B5',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#DCEBF9',
                },
                textTransform: 'none',
                fontSize: '20px',
                padding: '8px 16px',
                borderRadius: '6px',
              }}
            >
              {item.buttonText}
            </Button>
          </div>
        ))}
      </div>
  );
}

export default Botones;