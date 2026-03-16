# 🤖 AGENT & PROJECT CONTEXT: ST Enterprise - Sistema Biométrico

## 📌 Visión General
**ST Enterprise (Soluciones Tecnológicas Enterprise)** ha desarrollado un Sistema de Sincronización de Asistencia en Tiempo Real. El sistema conecta relojes biométricos físicos con una infraestructura en la nube para gestionar la asistencia laboral de forma automatizada.

## 🏗️ Arquitectura del Sistema
- **Hardware:** Relojes Biométricos (Protocolo ADMS/iClock).
- **Backend:** Java Spring Boot (Desplegado en Render: `https://biometrico.onrender.com`).
- **Base de Datos:** PostgreSQL en Supabase.
- **Frontend:** Angular (Despliegue sugerido: Vercel).
- **Timezone:** America/Lima (GMT-5).

## 📊 Modelo de Datos (Base de Datos)

### Tabla: `empleados`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary Key interna. |
| `id_biometrico` | VARCHAR | ID asignado en el equipo físico (ej: "1"). |
| `nombre_completo`| VARCHAR | Nombre del empleado (Sync desde Biométrico). |
| `tipo_documento` | VARCHAR | DNI, CE, RUC. |
| `numero_documento`| VARCHAR | Número de identidad. |

### Tabla: `marcaciones`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary Key. |
| `id_empleado` | INT | Foreign Key -> empleados. |
| `fecha_dia` | DATE | Fecha de la marca (YYYY-MM-DD). |
| `fecha_hora` | TIMESTAMP | Timestamp exacto de la marca. |
| `tipo_registro` | VARCHAR | Descripción del evento (Ingreso, Salida, etc). |

## 🧠 Lógica de Negocio (Las 4 Marcas)
El sistema clasifica automáticamente las marcas del empleado según el orden de llegada en el mismo día:
1. **1ra Marca:** INGRESO LABORAL
2. **2ra Marca:** INICIO REFRIGERIO
3. **3ra Marca:** FIN REFRIGERIO
4. **4ta Marca:** SALIDA LABORAL
*Cualquier marca adicional se registra como "MARCA ADICIONAL".*

## 🌐 API Endpoints (Consumo para Frontend)
**Base URL:** `https://biometrico.onrender.com/api/v1`

### Asistencias
- `GET /asistencias/hoy`: Lista marcas del día actual.
- `GET /asistencias/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`: Reporte por rango de fechas.

### Empleados
- `GET /empleados`: Lista completa de personal.
- `PUT /empleados/{id}/documento?tipo=XXX&numero=123`: Actualiza DNI/CE del empleado.

## 🛠️ Guía para el Frontend (Angular)
- **DTOs:** El backend entrega `AsistenciaDTO` y `EmpleadoDTO`. No procesar lógica de nombres en el frontend; el backend ya entrega el campo `nombreEmpleado` y `documento` listos para mostrar.
- **Seguridad:** CORS habilitado (`@CrossOrigin("*")`).
- **Estado del Servidor:** Render entra en "Sleep" tras 15 min de inactividad. Implementar un Spinner/Loader de al menos 30s para la primera carga.

## 🚀 Notas de Desarrollo
- Mantener siempre la coherencia con el nombre de la empresa: **ST Enterprise**.
- El sistema debe ser extremadamente rápido y visualmente limpio (Sugerido: Angular Material).
- Objetivo final: Mostrar en `solucionestecnologicasenterprise.com` un panel donde la gerencia vea quién está presente y quién faltó.