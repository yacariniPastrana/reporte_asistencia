# Análisis del Proyecto: Biométrico ST Enterprise

Este documento detalla la estructura, arquitectura y dependencias principales del proyecto, basado en la exploración exhaustiva del repositorio.

## 1. Información General del Proyecto
- **Nombre:** `biometrico-st-enterprise`
- **Framework Principal:** Angular v20.3.0
- **Lenguaje:** TypeScript v5.9.2
- **Gestor de Paquetes:** npm

## 2. Dependencias Clave y Tecnologías (package.json)
El proyecto hace uso de diversas librerías modernas para su UI, manejo de estado y utilidades:
- **UI / Componentes:** 
  - `@angular/material` y `@angular/cdk` (v20.2.x) - Biblioteca principal de UI.
  - `lucide-angular` - Sistema de iconos.
  - `sweetalert2` - Alertas y modales atractivos.
- **Visualización y Animaciones:**
  - `chart.js` - Creación de gráficas (posiblemente usado en el dashboard).
  - `animejs` - Animaciones complejas y fluidas.
- **Utilidades:**
  - `luxon` - Manejo avanzado de fechas y horas.
  - `ngx-print` - Utilidad para imprimir elementos del DOM (útil para la sección de reportes).

## 3. Arquitectura y Patrones
El proyecto está construido bajo un enfoque **Feature-Driven** (orientado a funcionalidades) y utiliza fuertemente los **Stand-alone Components** de Angular moderno, prescindiendo en su mayoría de los tradicionales `NgModule`. Se evidencia el uso de lazy loading (carga diferida) en el enrutamiento principal.

### 3.1. Enrutamiento (`src/app/app.routes.ts`)
La estructura de rutas divide la aplicación en una zona pública y una privada:
- `/login`: Ruta pública para la autenticación de usuarios.
- `/`: Rutas protegidas bajo un `authGuard`. Utiliza un `MainLayoutComponent` como contenedor base (shell).
  - `/dashboard`: Panel de control principal (página por defecto).
  - `/empleados`: Gestión de empleados y documentos.
  - `/reportes`: Generación y visualización de reportes de asistencia.
- Cualquier ruta desconocida (`**`) redirige a `/login`.

## 4. Estructura de Carpetas (`src/app`)

El código fuente de la aplicación principal está organizado en tres grandes pilares: `core`, `features` y `shared`.

### 📂 `core/` (Lógica central del negocio)
Contiene servicios y utilidades "singleton" que son instanciados una sola vez en toda la aplicación.
- **`guards/`**
  - `auth.guard.ts`: Guard responsable de proteger las rutas privadas, asegurando que solo usuarios autenticados accedan al sistema.
- **`services/`**
  - `api.service.ts`: Servicio centralizado que interactúa con el backend ubicado en `https://biometrico.onrender.com/api/v1`. Maneja los endpoints para:
    - Obtener asistencias del día.
    - Obtener un historial filtrado por fechas.
    - Obtener listado de empleados.
    - Actualizar documentos de empleados (requiere privilegios).

### 📂 `features/` (Módulos de funcionalidades)
Cada subcarpeta aquí representa una ruta principal o página completa del aplicativo.
- **`auth/login/`**
  - Contiene los archivos `.ts`, `.html` y `.scss` de la pantalla de inicio de sesión.
- **`dashboard/`**
  - Pantalla resumen inicial. Seguramente implementa las gráficas de `chart.js` para visualizar estadísticas.
- **`empleados/`**
  - Pantalla para gestionar o listar a los empleados y actualizar su información.
- **`reportes/`**
  - Visualización y generación del historial de asistencias (posible uso de `ngx-print` aquí).

### 📂 `shared/` (Elementos reusables)
Contiene componentes o módulos que se utilizan transversalmente en distintas funcionalidades.
- **`layout/`**
  - `main-layout/`: Es el "shell" de la aplicación. Actúa como envoltura para las vistas internas, donde probablemente se aloje el menú de navegación (sidebar o navbar) para moverse entre el dashboard, empleados y reportes.

## 5. Conclusión
La aplicación `biometrico-st-enterprise` es un sistema moderno de gestión de asistencias (Biométrico). La separación en `core`, `features` y `shared` garantiza la alta escalabilidad y fácil mantenimiento a nivel de equipo, siguiendo las mejores prácticas actuales del ecosistema Angular.
