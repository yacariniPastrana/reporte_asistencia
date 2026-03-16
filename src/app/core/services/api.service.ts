import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'https://biometrico.onrender.com/api/v1';

  // Obtener asistencias de hoy
  getAsistenciasHoy(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/asistencias/hoy`).pipe(
      timeout(60000),
      catchError(this.handleError)
    );
  }

  // Obtener historial por rango
  getHistorial(desde: string, hasta: string): Observable<any> {
    return this.http.get(`${this.BASE_URL}/asistencias/historial?desde=${desde}&hasta=${hasta}`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener empleados
  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/empleados`).pipe(
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
