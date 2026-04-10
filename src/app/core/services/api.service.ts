import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AsistenciaDTO } from '../models/asistencia.dto';
import { EmpleadoDTO } from '../models/empleado.dto';
import { LoginRequest, LoginResponse } from '../models/auth.dto';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'https://biometrico.onrender.com/api/v1';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/auth/login`, credentials);
  }

  getAsistenciasHoy(): Observable<AsistenciaDTO[]> {
    return this.http.get<AsistenciaDTO[]>(`${this.BASE_URL}/asistencias/hoy`).pipe(
      map((asistencias) => {
        if (!Array.isArray(asistencias)) return asistencias;
        return asistencias.filter(a => {
          const idStr = String(a.idBiometrico || a.empleadoId || '');
          return idStr !== '1' && idStr !== '2';
        });
      })
    );
  }

  getHistorial(desde: string, hasta: string): Observable<AsistenciaDTO[]> {
    return this.http.get<AsistenciaDTO[]>(`${this.BASE_URL}/asistencias/historial?desde=${desde}&hasta=${hasta}`);
  }

  procesarDia(idBiometrico: string, fecha: string): Observable<AsistenciaDTO> {
    return this.http.get<AsistenciaDTO>(`${this.BASE_URL}/asistencias/procesar-dia?idBiometrico=${idBiometrico}&fecha=${fecha}`);
  }

  guardarManual(payload: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/asistencias/guardar-manual`, payload, { responseType: 'text' });
  }

  getEmpleados(): Observable<EmpleadoDTO[]> {
    return this.http.get<EmpleadoDTO[]>(`${this.BASE_URL}/empleados`).pipe(
      map(empleados => {
        if (!Array.isArray(empleados)) return empleados;
        return empleados
          .filter(e => {
            const idStr = String(e.idBiometrico || e.id || '');
            return idStr !== '1' && idStr !== '2';
          })
          .sort((a, b) => {
            // Ordenamiento numérico correlativo por idBiometrico
            const idA = Number(a.idBiometrico) || 0;
            const idB = Number(b.idBiometrico) || 0;
            return idA - idB;
          });
      })
    );
  }

  borrarMarcasDelDia(fecha: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/asistencias/dia?fecha=${fecha}`, { responseType: 'text' });
  }

  borrarMarcaIndividual(idBiometrico: string, fecha: string, tipoRegistro: string): Observable<any> {
    return this.http.delete(
      `${this.BASE_URL}/asistencias/marca?idBiometrico=${idBiometrico}&fecha=${fecha}&tipoRegistro=${encodeURIComponent(tipoRegistro)}`,
      { responseType: 'text' }
    );
  }

  updateDocumento(id: number, tipo: string, numero: string): Observable<any> {
    return this.http.put(`${this.BASE_URL}/empleados/${id}/documento?tipo=${tipo}&numero=${numero}`, {}, { responseType: 'text' });
  }
}
