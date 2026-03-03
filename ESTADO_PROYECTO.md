# Estado del Proyecto `frontendPI`

---

## 🟢 Funcionalidades Implementadas

- **Registro de estudiantes:**
  - Formulario de registro y edición de estudiantes (App.js, StudentForm.js).
  - Listado y edición de estudiantes (StudentTable.js).
- **Acompañamientos:**
  - Agregar acompañamientos a estudiantes (AgregarAcompanamiento.js). -- Listo
- **Historial y filtros:**
  - Visualización de historial de tutorías y filtros por mes (TutoringHistoryView.js, HistorialAsesorias.js).
- **Creación de formularios:**
  - Generador de formularios personalizados (FormCreator.js).
  - Renderizado de formularios públicos para estudiantes (StudentForm.js).
- **Notificaciones:**
  - Centro de notificaciones básico (NotificationCenter.js).
- **Selector de mes:**
  - Componente reutilizable para seleccionar meses (MonthPicker.js). -- Listo

---

## 🟡 Funcionalidades Parcialmente Implementadas o Frágiles

- **Tipos de sesión y estadísticas:**
  - IDs de tipos de sesión y vulnerabilidad están hardcodeados.
  - Estadísticas y filtros funcionan, pero dependen de datos fijos o incompletos.
- **Creación de formularios:**
  - El mapeo de preguntas y tipos es frágil y depende de IDs fijos.
- **Flujo de formulario público:**
  - El parseo de preguntas es robusto, pero depende de la consistencia del backend.

---

## 🔴 Funcionalidades Faltantes o Incompletas

- **Autenticación y control de acceso:**
  - No hay login ni manejo centralizado de roles. -- Revisar
  - El usuario es hardcodeado en App.js.
- **Ruteo:**
  - No se usa react-router-dom para rutas; se parsea window.location.pathname manualmente. -- Listo
- **Cliente API centralizado:**
  - No existe un helper de axios para manejar tokens y errores de forma uniforme. -- En progreso
- **Reportes y dashboards:**
  - No hay gráficos ni reportes implementados, aunque se menciona en los HUs. 
- **Alertas y sistema de riesgo:**
  - No hay lógica de generación automática de alertas o scoring de riesgo.
- **Validaciones y accesibilidad:**
  - Validaciones mínimas, poca accesibilidad (aria, focus, etc).
- **Pruebas y CI:**
  - No hay tests más allá del setup default de React.

---

## ⚠️ Problemas Detectados y Riesgos

- **IDs hardcodeados:**
  - Muchos componentes usan IDs fijos de la base de datos (tipos de sesión, vulnerabilidad, universidades, etc). Esto dificulta el despliegue en otros entornos. -- Falta
- **Inconsistencia en el token:**
  - Algunos usan 'jwt', otros 'token' en localStorage. Puede causar fallos de autenticación.
- **Llamadas API inconsistentes:**
  - Mezcla de endpoints v1/v2 y headers incompletos. -- Listo
- **Fragilidad en el parseo de formularios:**
  - Si el backend cambia, el frontend puede fallar silenciosamente. -- Faltan pruebas
- **Manejo de fechas y horas:**
  - Formateo y parseo ad-hoc, riesgo de bugs por zona horaria. -- Falta
- **Activos estáticos:**
  - Imágenes referenciadas pueden faltar y romper la UI. -- Revisar

---

## 🧩 Gaps Universales

- Falta de cliente API centralizado.
- Falta de login y rutas protegidas.
- Validación y accesibilidad limitadas.
- Sin tests ni CI.
- Uso inconsistente de variables de entorno y tokens.

---

## 📋 Siguientes pasos sugeridos

- Crear un helper de axios centralizado y un archivo de constantes para IDs.
- Unificar el uso del token ('token' o 'jwt').
- Migrar a react-router-dom para el ruteo.
- Implementar login y control de roles.
- Mejorar validaciones y accesibilidad.
- Añadir tests y configuración de CI.

---

## ❓ Preguntas para el equipo

- ¿Qué nombre de token prefieren: 'token' o 'jwt'?
- ¿Se puede agregar un endpoint en backend para listar IDs constantes?
- ¿Quieren que implemente el cliente axios y la migración de IDs primero?

---

> _Colores:_
> - 🟢 Implementado
> - 🟡 Parcial
> - 🔴 Faltante
> - ⚠️ Problema
> - 🧩 Gap universal
> - 📋 Siguiente paso
> - ❓ Pregunta

---
