# 📑 ST Enterprise - Especificaciones Detalladas del Proyecto

## 🎯 Visión del Sistema
Desarrollar un Dashboard empresarial de alta gama para la gestión de asistencia biométrica, con un enfoque en la limpieza visual, animaciones profesionales y reportabilidad lista para impresión.

## 🔑 Credenciales y Roles (Acceso Local)
| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `USO001` | `STE2027` | **Cliente** | Lectura, consultas y reportes A4. |
| `STE001` | `ADM1252` | **Admin** | Control total (CRUD, edición de marcas). |

## 🎨 Identidad Visual e Interfaz (UI/UX)
- **Logo:** `LOGOSTE.svg` (12 partes: `A1` a `A12`).
- **Animaciones:** Uso de **anime.js** para el ensamblaje del logo y transiciones de entrada.
- **Estética:** Profesional, limpia y corporativa (Angular Material + SCSS).
- **Carga:** Spinner/Loader de **30 segundos** obligatorio al inicio para manejar el "Cold Start" de Render.
- **Footer:** Pequeño anuncio de **ST Enterprise** presente en todas las vistas y reportes impresos.

## 📊 Funcionalidades del Dashboard
- **Listados:** Ingreso, Inicio/Fin Refrigerio, Salida, Marcas Adicionales.
- **Consultas:** Filtros por empleado y rangos de fecha.
- **Reportes:** Generación de archivos optimizados para impresión en **Hoja A4**.
- **Admin Tools:** Capacidad de modificar o eliminar registros y gestionar el personal.

## 🛠️ Stack Tecnológico Seleccionado
- **Framework:** Angular (Stand-alone components).
- **Estilos:** SCSS + Angular Material.
- **Iconografía:** Lucide Icons.
- **Alertas:** SweetAlert2 (diseño premium).
- **Gráficos:** Chart.js (estadísticas de asistencia).
- **Fechas:** Luxon (Timezone: America/Lima GMT-5).
- **Impresión:** `ngx-print` + CSS Media Queries (@media print).

## 🌐 Infraestructura y API
- **Base URL:** `https://biometrico.onrender.com/api/v1`
- **Estrategia Anti-Sleep:** Configuración externa de **UptimeRobot** y manejo de estados de carga en el frontend.
- **Lógica de Marcas:** Clasificación automática basada en el orden de llegada diario.

---
*Este documento sirve como guía maestra para el desarrollo del sistema Biométrico ST Enterprise.*