# 🤖 AGENT & PROJECT CONTEXT: ST Enterprise - Dashboard Biométrico v3.0

## 📌 Visión General
**ST Enterprise (Soluciones Tecnológicas Enterprise)** gestiona un Dashboard de alta gama para el control de asistencia. El sistema destaca por su limpieza visual, animaciones profesionales (logo ensamblado por piezas) y una reportabilidad precisa orientada a la gerencia.

## 🏗️ Arquitectura y Stack
- **Backend:** Java 17 + Spring Boot (`https://biometrico.onrender.com`).
- **Base de Datos:** PostgreSQL en Supabase.
- **Frontend:** Angular 17+ (Stand-alone components) + SCSS.
- **Librerías UI:** Angular Material, Lucide Icons, SweetAlert2, Chart.js.
- **Animaciones:** `anime.js` (para el logo `LOGOSTE.svg` de 12 piezas).

## 🔑 Gestión de Accesos (Roles)
| Rol | Usuario (Nombre) | Contraseña (DNI/RUC) | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `STE001` (o Adm) | `ADM1252` | Control total, CRUD, edición de marcas. |
| **Usuario/Cliente** | `USO001` (o Rony) | `STE2027` | Lectura, consultas y reportes A4. |

## 🧠 Lógica de Negocio y Procesamiento
### 1. Clasificación de Asistencia (Las 4 Marcas)
1. **1ra:** INGRESO LABORAL.
2. **2da:** INICIO REFRIGERIO.
3. **3ra:** FIN REFRIGERIO.
4. **4ta:** SALIDA LABORAL.

### 2. Cálculo Automático de Horas
- **Fórmula:** (Última marca del día) - (Primera marca del día).
- **Regla del Almuerzo:** Si la salida es posterior a las **15:00**, el sistema resta **1 hora** de refrigerio automáticamente al total diario.

## 📊 Especificaciones del Frontend
- **Identidad:** Uso obligatorio del logo `LOGOSTE.svg`. Las piezas `A1` a `A12` deben ensamblarse con `anime.js` al cargar.
- **Reportes:** Generación de documentos en **Hoja A4** mediante `ngx-print`.
- **UX de Carga:** Debido al "Cold Start" de Render, se requiere un **Spinner de 30 segundos** con un mensaje corporativo de ST Enterprise.
- **Timezone:** Estricto `America/Lima (GMT-5)` usando Luxon.

## 🌐 API Endpoints Principales
- `POST /auth/login`: Autenticación por roles.
- `GET /asistencias/procesar-dia`: Corazón del reporte (calcula horas netas por fecha).
- `POST /asistencias/guardar-manual`: Registro de marcas por omisión (Solo Admin).
- `PUT /empleados/{id}/documento`: Gestión de datos de identidad.

---
**ST Enterprise - Soluciones Tecnológicas de Vanguardia.**