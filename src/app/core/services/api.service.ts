import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, timeout, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'https://biometrico.onrender.com/api/v1';

  // Login
  login(credentials: { usuario: string; password: string }): Observable<any> {
    return this.http.post(`${this.BASE_URL}/auth/login`, credentials).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener asistencias de hoy
  getAsistenciasHoy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/asistencias/hoy`).pipe(
      timeout(60000),
      map((asistencias) => {
        if (!Array.isArray(asistencias)) return asistencias;
        return asistencias.filter(a => {
          const idStr = String(a.idBiometrico || a.empleadoId || '');
          return idStr !== '1' && idStr !== '2';
        });
      }),
      catchError(this.handleError)
    );
  }

  // Obtener historial por rango (Legado, se recomienda usar procesarDia)
  getHistorial(desde: string, hasta: string): Observable<any> {
    return this.http.get(`${this.BASE_URL}/asistencias/historial?desde=${desde}&hasta=${hasta}`).pipe(
      catchError(this.handleError)
    );
  }

  // Procesar día de asistencia por idBiometrico y fecha ISO
  procesarDia(idBiometrico: string, fecha: string): Observable<any> {
    return this.http.get(`${this.BASE_URL}/asistencias/procesar-dia?idBiometrico=${idBiometrico}&fecha=${fecha}`).pipe(
      catchError(this.handleError)
    );
  }

  // Guardar marca asis manual (Admin)
  guardarManual(payload: any): Observable<any> {
    // responseType text o json según corresponda, usando text para prevenir error de parseo si es vacio
    return this.http.post(`${this.BASE_URL}/asistencias/guardar-manual`, payload, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener empleados
  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/empleados`).pipe(
      map(empleados => {
        if (!Array.isArray(empleados)) return empleados;
        return empleados.filter(e => {
          const idStr = String(e.idBiometrico || e.id || '');
          return idStr !== '1' && idStr !== '2';
        });
      }),
      catchError(this.handleError)
    );
  }

  // Actualizar documento de empleado (Solo Admin)
  updateDocumento(id: number, tipo: string, numero: string): Observable<any> {
    // Agregamos responseType: 'text' para evitar errores de parseo JSON
    return this.http.put(`${this.BASE_URL}/empleados/${id}/documento?tipo=${tipo}&numero=${numero}`, {}, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
}
