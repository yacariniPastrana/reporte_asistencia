# 📋 Documentación Técnica — Biométrico ST Enterprise

> **Sistema de Control de Asistencia Biométrica**  
> ST Enterprise S.A.C — Soluciones Tecnológicas  
> Versión: `3.0` | Última actualización: Abril 2026

---

## 📑 Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Proyecto](#3-arquitectura-del-proyecto)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Módulos y Componentes](#5-módulos-y-componentes)
6. [Capa de Servicios (Core)](#6-capa-de-servicios-core)
7. [Modelos de Datos (DTOs)](#7-modelos-de-datos-dtos)
8. [API REST — Endpoints](#8-api-rest--endpoints)
9. [Sistema de Roles y Autenticación](#9-sistema-de-roles-y-autenticación)
10. [Lógica de Negocio](#10-lógica-de-negocio)
11. [Comandos de Desarrollo](#11-comandos-de-desarrollo)
12. [Variables de Entorno y Configuración](#12-variables-de-entorno-y-configuración)

---

## 1. Visión General

**Biométrico ST Enterprise** es una aplicación web Angular que actúa como **frontend de gestión y visualización** del sistema de control de asistencia por huella dactilar. Se conecta a un backend Java/Spring Boot alojado en Render y una base de datos PostgreSQL en Supabase.

### Funcionalidades principales

| Módulo | Descripción | Acceso |
|---|---|---|
| 🏠 **Dashboard** | Panel en tiempo real con estadísticas del día, gráfico de donut y recordatorios de cumpleaños | Todos |
| 👥 **Empleados** | Lista paginada y buscable de personal con edición de documentos | Admin: edición / Usuario: lectura |
| 📊 **Reportes** | Matriz de asistencia por rango de fechas con exportación PDF A4 | Todos |
| 🔑 **Login** | Autenticación por usuario y contraseña con persistencia de sesión | Público |

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Angular | `^20.3.0` | Framework principal (Standalone Components) |
| TypeScript | `~5.9.2` | Lenguaje base |
| SCSS | — | Estilos por componente |
| Angular Material | `^20.2.14` | Componentes UI (tablas, formularios, botones) |
| Chart.js | `^4.5.1` | Gráfico de donut en el dashboard |
| Anime.js | `^3.2.2` | Animación del logo SVG por piezas (A1–A12) |
| Luxon | `^3.7.2` | Manejo de fechas/horas con timezone `America/Lima` |
| SweetAlert2 | `^11.26.23` | Modales de confirmación y alertas |
| ngx-print | `^21.2.0` | Exportación a PDF en hoja A4 landscape |
| Lucide Angular | `^0.577.0` | Iconografía adicional |
| RxJS | `~7.8.0` | Programación reactiva y manejo de observables |

### Backend (externo)
| Tecnología | Detalle |
|---|---|
| Java 17 + Spring Boot | API REST, lógica de negocio |
| PostgreSQL (Supabase) | Base de datos relacional en la nube |
| Hosting | Render (`https://biometrico.onrender.com`) |

> ⚠️ **Cold Start:** El backend en Render tiene hibernación automática. El interceptor HTTP aplica un **timeout de 45 segundos** y un spinner de espera para manejar este comportamiento.

---

## 3. Arquitectura del Proyecto

El proyecto sigue un patrón **Feature-Driven Architecture** con lazy loading por ruta, usando exclusivamente **Standalone Components** (sin NgModules tradicionales).

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Angular SPA)               │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ /login   │  │/dashboard│  │/empleados│  │/report.│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│         ↕             ↕             ↕            ↕      │
│              ApiService (HTTP + Interceptor)            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│        Spring Boot API (biometrico.onrender.com)        │
│                                                         │
│   /auth/login    /empleados    /asistencias/...         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL — Supabase                       │
└─────────────────────────────────────────────────────────┘
```

### Flujo de autenticación

```
Usuario ingresa credenciales
        ↓
POST /auth/login
        ↓
Backend devuelve { token, rol, usuario }
        ↓
Frontend guarda en localStorage:
  - is_logged_in = 'true'
  - user_role = 'admin' | 'user'
  - auth_token = <JWT>
        ↓
authGuard protege rutas privadas
```

---

## 4. Estructura de Carpetas

```
src/app/
│
├── core/                          # Lógica central (singleton)
│   ├── guards/
│   │   └── auth.guard.ts          # Protección de rutas privadas
│   ├── interceptors/
│   │   └── api.interceptor.ts     # Spinner global + timeout + error handler
│   ├── models/
│   │   ├── asistencia.dto.ts      # DTO de registros de asistencia
│   │   ├── auth.dto.ts            # DTOs de login (request/response)
│   │   ├── empleado.dto.ts        # DTO de empleado
│   │   └── error.response.ts      # DTO de errores del backend
│   └── services/
│       ├── api.service.ts         # Todos los llamados HTTP al backend
│       └── loading.service.ts     # Control del spinner global
│
├── features/                      # Módulos de funcionalidad (páginas)
│   ├── auth/login/                # Pantalla de inicio de sesión
│   ├── dashboard/                 # Panel principal con estadísticas
│   ├── empleados/                 # Gestión de personal
│   └── reportes/                  # Historial y exportación de reportes
│
├── shared/                        # Elementos reutilizables
│   ├── components/
│   │   └── loader-logo/           # Componente del spinner con logo animado
│   └── layout/
│       └── main-layout/           # Shell principal (sidebar + outlet)
│
├── app.routes.ts                  # Definición de rutas con lazy loading
├── app.config.ts                  # Providers globales (HttpClient, interceptores)
└── app.ts                         # Componente raíz
```

---

## 5. Módulos y Componentes

### 5.1 Login (`/login`)
Pantalla pública de autenticación.
- Formulario con campos `usuario` y `password`
- Al autenticar se guardan `is_logged_in`, `user_role` y `auth_token` en `localStorage`
- Redirige automáticamente al dashboard si ya hay sesión activa

---

### 5.2 Dashboard (`/dashboard`)
Panel de control en tiempo real.

**Datos cargados al iniciar:**
- `getAsistenciasHoy()` → lista de marcas del día
- `getEmpleados()` → para detectar cumpleaños del mes actual

**Estadísticas calculadas en `procesarStats()`:**

| Estado | Condición de marcas del día |
|---|---|
| 🔵 Pendientes (Ingreso) | 1 marca ó 3 marcas (volvió del refrigerio) |
| 🔴 En Refrigerio | 2 marcas y hora < 15:00 |
| 🟢 Completados (Salida) | 2 marcas y hora ≥ 15:00, ó 4+ marcas |

**Rate Limiting de refresco manual:**
- Máximo **5 refrescos** por sesión antes de activar cooldown de **1 hora**
- Evita sobrecarga del servidor en horario pico

**Sección de Cumpleaños:**
- Filtra empleados con `fechaCumpleanos` en el mes actual
- Ordenados por día más cercano
- Muestra iniciales con colores aleatorios

---

### 5.3 Empleados (`/empleados`)
Lista oficial de empleados del sistema biométrico.

**Funcionalidades:**
- Búsqueda en tiempo real por nombre, ID biométrico o número de documento
- Lista ordenada correlativamente por `idBiometrico` (orden numérico ascendente)
- Los IDs biométricos `1` y `2` (usuarios de prueba/admin) son **filtrados** del listado

**Permisos por rol:**

| Acción | Admin | Usuario |
|---|---|---|
| Ver lista | ✅ | ✅ |
| Buscar empleados | ✅ | ✅ |
| Editar documento (tipo + número) | ✅ | ❌ |

---

### 5.4 Reportes (`/reportes`)
Historial de asistencia en formato matricial por rango de fechas.

**Funcionamiento:**
1. El admin/usuario selecciona rango **Desde → Hasta**
2. Se lanzan peticiones paralelas con `forkJoin`: **N empleados × M días** llamadas a `procesarDia()`
3. Se construye una matriz: filas = empleados, columnas = fechas
4. Cada celda muestra: Ingreso, Salida, Inicio Refrigerio, Salida Refrigerio en formato AM/PM
5. Columna final: Total de horas en formato `Xh Ym`

**Acciones exclusivas del Administrador:**

| Botón | Icono | Acción |
|---|---|---|
| **MARCA MANUAL** | `add_alert` | Abre modal para registrar una marca de emergencia en cualquier fecha/hora |
| **ANULAR MARCA** | `block` | Pone `null` (---) en una marca específica de un empleado por tipo y fecha |
| **Botón inline** `block` | En cada celda con datos | Precarga el empleado y fecha de esa celda para anulación rápida |

**Exportación PDF:**
- Botón "IMPRIMIR PDF" con `ngx-print`
- Formato A4 landscape con cabecera corporativa (logo + nombre empresa)
- Los botones de admin tienen clase `no-print` y no aparecen en el PDF

---

## 6. Capa de Servicios (Core)

### 6.1 `ApiService`
Servicio centralizado para todas las llamadas HTTP al backend.

```typescript
BASE_URL = 'https://biometrico.onrender.com/api/v1'
```

| Método | HTTP | Ruta | Descripción |
|---|---|---|---|
| `login(credentials)` | POST | `/auth/login` | Autenticación de usuario |
| `getAsistenciasHoy()` | GET | `/asistencias/hoy` | Marcas del día actual |
| `getHistorial(desde, hasta)` | GET | `/asistencias/historial` | Historial por rango |
| `procesarDia(idBio, fecha)` | GET | `/asistencias/procesar-dia` | Calcula horario de un empleado en un día |
| `guardarManual(payload)` | POST | `/asistencias/guardar-manual` | Registra o anula una marca (Admin) |
| `getEmpleados()` | GET | `/empleados` | Lista de empleados (filtrada + ordenada) |
| `updateDocumento(id, tipo, num)` | PUT | `/empleados/{id}/documento` | Actualiza documento de identidad |
| `borrarMarcasDelDia(fecha)` | DELETE | `/asistencias/dia` | Borra todas las marcas de una fecha |
| `borrarMarcaIndividual(idBio, fecha, tipo)` | DELETE | `/asistencias/marca` | Borra una marca específica |

> **Nota `getEmpleados()`:** Aplica `.filter()` para excluir IDs 1 y 2, y `.sort()` numérico por `idBiometrico` para garantizar el orden correlativo.

---

### 6.2 `apiInterceptor` (Interceptor HTTP)
Interceptor funcional que aplica a **todas** las peticiones HTTP.

**Responsabilidades:**
1. 🔄 **Activa el spinner global** al iniciar cualquier petición
2. ⏱️ **Timeout de 45 segundos** para manejar el Cold Start de Render
3. ❌ **Centraliza el manejo de errores** con SweetAlert2:
   - Error de red/cliente → mensaje de red
   - Timeout → mensaje de reactivación del servidor
   - Error HTTP del backend → muestra `error.message` del DTO
4. ✅ **Oculta el spinner** en el `finalize()` (siempre, con o sin error)

---

### 6.3 `LoadingService`
Servicio reactivo que controla la visibilidad del spinner global.

```typescript
show()  → isLoading$.next(true)
hide()  → isLoading$.next(false)
```

El `MainLayoutComponent` o el componente raíz suscribe este observable para mostrar/ocultar el overlay de carga.

---

### 6.4 `authGuard`
Guard de tipo `CanActivateFn` que protege todas las rutas bajo `/`.

```typescript
// Condición de acceso:
localStorage.getItem('is_logged_in') === 'true'
// Si no → redirige a /login
```

---

## 7. Modelos de Datos (DTOs)

### `EmpleadoDTO`
```typescript
interface EmpleadoDTO {
  id: number;
  idBiometrico: string;      // ID del equipo biométrico
  nombreCompleto?: string;
  nombres?: string;           // Retrocompatibilidad
  nombre?: string;            // Retrocompatibilidad
  tipoDocumento?: string;     // 'DNI' | 'CE' | 'RUC'
  numeroDocumento?: string;
  privilegio?: string;
  fechaCumpleanos?: string;   // ISO 8601
}
```

### `AsistenciaDTO`
```typescript
interface AsistenciaDTO {
  id?: number;
  idBio?: string;
  empleadoId?: number;
  idBiometrico?: string;      // Retrocompatibilidad
  nombreEmpleado?: string;
  documento?: string;
  tipoRegistro: string;       // 'INGRESO LABORAL' | 'INICIO REFRIGERIO' | ...
  hora: string;               // 'HH:mm:ss.SSSSSS'
  fecha: string;              // 'YYYY-MM-DD'
  horasTrabajadas?: number;   // Decimal (ej: 8.5 = 8h 30m)
}
```

### `LoginRequest / LoginResponse`
```typescript
interface LoginRequest {
  usuario: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  rol?: string;
  usuario?: string;
  [key: string]: any;  // Payload adicional flexible
}
```

### Payload de Marca Manual / Anulación
```typescript
{
  idBiometrico: string;
  fechaHora: string | null;   // null = anular la marca
  tipoRegistro: string;       // 'INGRESO LABORAL' | 'INICIO REFRIGERIO' | 'FIN REFRIGERIO' | 'SALIDA LABORAL'
  fecha?: string;             // YYYY-MM-DD (cuando se anula)
  motivoEdicion: string;      // Texto de auditoría
  esManual: boolean;          // Siempre true
  anular?: boolean;           // true = operación de anulación
}
```

---

## 8. API REST — Endpoints

**Base URL:** `https://biometrico.onrender.com/api/v1`

### Autenticación
```
POST   /auth/login
Body:  { usuario, password }
Resp:  { token, rol, usuario }
```

### Asistencias
```
GET    /asistencias/hoy
       → AsistenciaDTO[]  (marcas del día)

GET    /asistencias/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
       → AsistenciaDTO[]

GET    /asistencias/procesar-dia?idBiometrico=X&fecha=YYYY-MM-DD
       → AsistenciaDTO   (datos procesados: entrada, salida, refrigerio, horas)

POST   /asistencias/guardar-manual
Body:  { idBiometrico, fechaHora, tipoRegistro, motivoEdicion, esManual, anular? }
Resp:  text/plain

DELETE /asistencias/dia?fecha=YYYY-MM-DD
       → Elimina todas las marcas de una fecha

DELETE /asistencias/marca?idBiometrico=X&fecha=YYYY-MM-DD&tipoRegistro=TIPO
       → Elimina una marca específica
```

### Empleados
```
GET    /empleados
       → EmpleadoDTO[]

PUT    /empleados/{id}/documento?tipo=DNI&numero=12345678
       → text/plain
```

---

## 9. Sistema de Roles y Autenticación

El rol se guarda en `localStorage` después del login y se usa en todos los componentes para habilitar/deshabilitar funcionalidades.

```typescript
// Lectura del rol en cualquier componente:
isAdmin = localStorage.getItem('user_role') === 'admin';
```

### Tabla de permisos por módulo

| Funcionalidad | Admin | Usuario |
|---|---|---|
| Ver Dashboard | ✅ | ✅ |
| Refrescar Dashboard | ✅ | ✅ |
| Ver lista de Empleados | ✅ | ✅ |
| Editar documento de empleado | ✅ | ❌ |
| Consultar Reportes | ✅ | ✅ |
| Imprimir PDF | ✅ | ✅ |
| Registrar Marca Manual | ✅ | ❌ |
| Anular una Marca (→ ---) | ✅ | ❌ |

### Credenciales del sistema

| Rol | Usuario | Contraseña |
|---|---|---|
| **Administrador** | `STE001` | `ADM1252` |
| **Usuario / Cliente** | `USO001` | `STE2027` |

---

## 10. Lógica de Negocio

### 10.1 Las 4 Marcas del Sistema

Cada empleado registra marcas en el equipo biométrico. El sistema las clasifica en orden cronológico:

```
1ra marca → INGRESO LABORAL
2da marca → INICIO REFRIGERIO
3ra marca → FIN REFRIGERIO
4ta marca → SALIDA LABORAL
```

### 10.2 Cálculo de Horas Trabajadas

El backend procesa las marcas de un día para un empleado y retorna `horasTrabajadas` (decimal).

**Regla del almuerzo:**
- Si la hora de la **2da marca** es ≥ 15:00 → se considera salida directa
- Si hay 4 marcas → se restan automáticamente los minutos de refrigerio del total

**Formato de horas en el frontend:**
```typescript
formatHoras(8.5) → "8h 30m"
formatHoras(0)   → "0h 0m"
```

### 10.3 Ordenamiento de Empleados

El frontend siempre ordena los empleados por `idBiometrico` de forma **numérica** (no lexicográfica):

```typescript
.sort((a, b) => Number(a.idBiometrico) - Number(b.idBiometrico))
```

Esto garantiza que el empleado con ID 3 aparezca antes que el 10, etc.

### 10.4 Filtro de IDs de Sistema

Los IDs biométricos `1` y `2` corresponden a cuentas de administración del equipo, no a empleados reales. Se filtran en `getEmpleados()` y `getAsistenciasHoy()`.

### 10.5 Anulación de Marcas

Cuando el administrador anula una marca, el frontend envía al endpoint `guardar-manual` con `fechaHora: null` y `anular: true`. El backend debe interpretar esto como: **establecer ese campo a NULL en la base de datos**. La celda del reporte mostrará `---` en su lugar.

---

## 11. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
npm start
# ó
ng serve

# Compilar para producción
ng build

# Ejecutar tests unitarios
ng test

# Build en modo watch (desarrollo continuo)
npm run watch
```

---

## 12. Variables de Entorno y Configuración

El proyecto no usa `environment.ts` explícito. La URL base está hardcodeada en el servicio:

```typescript
// src/app/core/services/api.service.ts
private readonly BASE_URL = 'https://biometrico.onrender.com/api/v1';
```

> Para cambiar el backend en producción o desarrollo local, modificar esta constante directamente.

### Configuraciones importantes en `angular.json`
- Output path: `dist/`
- Assets: `src/assets/` (incluye `images/logo-st.svg`)
- Styles globales: `src/styles.scss`

### Zona horaria
Toda la lógica de fechas usa **`America/Lima (GMT-5)`** via Luxon:
```typescript
DateTime.now().setZone('America/Lima')
```

---

## 🗂️ Historial de Cambios Recientes

| Fecha | Cambio |
|---|---|
| Abr 2026 | Ordenamiento numérico correlativo de empleados por `idBiometrico` |
| Abr 2026 | Implementación de `HttpInterceptor` global con spinner y manejo de errores centralizado |
| Abr 2026 | Dashboard: cálculo de estadísticas por comportamiento único de empleado (no por conteo de eventos) |
| Abr 2026 | Rate limiting de refresco manual: 5 clicks por hora |
| Abr 2026 | Reporte: Botón **MARCA MANUAL** para registros de emergencia (solo Admin) |
| Abr 2026 | Reporte: Botón **ANULAR MARCA** — pone `null` (---) en una marca específica (solo Admin) |
| Abr 2026 | Reporte: Botón inline de anulación en cada celda con datos del reporte |
| Abr 2026 | Dashboard: widget de cumpleaños del mes con iniciales y colores |
| Abr 2026 | Eliminación del botón "Borrar Marcas" de la sección Empleados |

---

> **ST Enterprise S.A.C** — Sistema de Control Biométrico  
> Desarrollado con Angular 20 + Spring Boot + PostgreSQL
