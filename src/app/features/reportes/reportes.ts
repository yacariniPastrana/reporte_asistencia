import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { NgxPrintModule } from 'ngx-print';
import { ApiService } from '../../core/services/api.service';

import { DateTime } from 'luxon';
import Swal from 'sweetalert2';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface EmpleadoReporte {
  idBiometrico: string;
  nombreEmpleado: string;
  totalHoras: number;
  dias: { [fechaISO: string]: any };
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    NgxPrintModule
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class ReportesComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  protected readonly DateTime = DateTime;

  reportForm: FormGroup = this.fb.group({
    desde: [DateTime.now().minus({ days: 7 }).toJSDate(), Validators.required],
    hasta: [DateTime.now().toJSDate(), Validators.required]
  });

  empleados: any[] = [];
  dataSource: EmpleadoReporte[] = [];
  dateColumns: string[] = []; // Nombres de columnas ISO
  displayedColumns: string[] = ['col-empleado', 'col-total'];
  isLoading = false;
  isAdmin = localStorage.getItem('user_role') === 'admin';

  ngOnInit() {
    this.apiService.getEmpleados().subscribe(emps => {
      this.empleados = emps;
    });
  }

  consultarHistorial(): void {
    if (this.reportForm.invalid || this.empleados.length === 0) return;

    this.isLoading = true;
    const desde = DateTime.fromJSDate(this.reportForm.value.desde);
    const hasta = DateTime.fromJSDate(this.reportForm.value.hasta);

    this.dateColumns = [];
    let currentDate = desde;
    
    // Generar columnas de días
    while (currentDate <= hasta) {
      this.dateColumns.push(currentDate.toFormat('yyyy-MM-dd'));
      currentDate = currentDate.plus({ days: 1 });
    }

    // El Set de columnas a renderizar (Fija Izq, Dinámicas Medio, Fija Der)
    this.displayedColumns = ['col-empleado', ...this.dateColumns, 'col-total'];

    // Inicializar matriz
    this.dataSource = this.empleados.map(emp => ({
      idBiometrico: emp.idBiometrico || emp.id,
      nombreEmpleado: emp.nombreCompleto || emp.nombre || emp.nombres || 'Emp ' + (emp.idBiometrico || emp.id),
      totalHoras: 0,
      dias: {}
    }));

    const peticiones = [];
    
    // Generar masivamente peticiones Empleados * Días
    for (let idx = 0; idx < this.dataSource.length; idx++) {
      const emp = this.dataSource[idx];
      for (const fechaStr of this.dateColumns) {
        peticiones.push(
          this.apiService.procesarDia(emp.idBiometrico, fechaStr).pipe(
            catchError(() => of(null)), // Tolerancia a fallo por día y empleado particular
            map(res => ({ indexRow: idx, fecha: fechaStr, data: res }))
          )
        );
      }
    }

    if (peticiones.length === 0) {
      this.isLoading = false;
      return;
    }

    forkJoin(peticiones).subscribe({
      next: (resultados) => {
        let registrosUtiles = 0;
        // Transponer respuestas al diccionario del Empleado Correcto
        for (const res of resultados) {
          if (res && res.data && Object.keys(res.data).length > 0) {
            registrosUtiles++;
            this.dataSource[res.indexRow].dias[res.fecha] = res.data;
            this.dataSource[res.indexRow].totalHoras += Number(res.data.horasTrabajadas || 0);
          }
        }
        
        // Disparar detección de cambios en mat-table
        this.dataSource = [...this.dataSource];
        this.isLoading = false;

        if (registrosUtiles === 0) {
          Swal.fire('Información', 'No se detectaron marcas para ningún empleado en este periodo.', 'info');
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'Hubo un fallo masivo calculando la red de asistencias.', 'error');
      }
    });
  }

  abrirNuevamMarcaManual(): void {
    if (this.empleados.length === 0) return;

    const opcionesHtml = this.empleados.map(emp => 
      `<option value="${emp.idBiometrico || emp.id}">${emp.nombreCompleto || emp.nombre || emp.nombres}</option>`
    ).join('');

    Swal.fire({
      title: 'Registro Manual (Emergencia)',
      width: '800px', // Ampliado aún más
      html: `
        <style>
          .custom-swal-input {
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
            margin: 5px 0 15px 0 !important;
            padding: 0 12px;
            height: 45px;
            font-size: 1rem;
            color: #333;
            border: 1px solid #ccc;
            border-radius: 4px;
            transition: border-color 0.15s ease-in-out;
            background-color: #fff;
          }
          .custom-swal-input:focus {
            outline: none;
            border-color: #3f51b5;
          }
        </style>
        <div style="text-align: left; margin-top: 10px; padding: 0 20px;">
          <label style="font-weight: 500; font-size: 0.9em;">Empleado Afectado</label>
          <select id="swal-empleado" class="custom-swal-input">
            ${opcionesHtml}
          </select>

          <label style="font-weight: 500; font-size: 0.9em;">Tipo de Registro</label>
          <select id="swal-tipo" class="custom-swal-input">
            <option value="INGRESO LABORAL">INGRESO LABORAL</option>
            <option value="INICIO REFRIGERIO">INICIO REFRIGERIO</option>
            <option value="FIN REFRIGERIO">FIN REFRIGERIO</option>
            <option value="SALIDA LABORAL">SALIDA LABORAL</option>
          </select>
          
          <label style="font-weight: 500; font-size: 0.9em;">Fecha y Hora</label>
          <input type="datetime-local" id="swal-fecha" class="custom-swal-input">
          
          <label style="font-weight: 500; font-size: 0.9em;">Motivo (Opcional/Auditoría)</label>
          <input type="text" id="swal-motivo" class="custom-swal-input" placeholder="Ej: Olvidó marcar...">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Marca',
      confirmButtonColor: '#3f51b5',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const idBio = (document.getElementById('swal-empleado') as HTMLSelectElement).value;
        const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement).value;
        let fechaHoraStr = (document.getElementById('swal-fecha') as HTMLInputElement).value;
        const motivo = (document.getElementById('swal-motivo') as HTMLInputElement).value;
        
        if (!fechaHoraStr) {
          Swal.showValidationMessage('La Fecha y Hora es obligatoria');
          return false;
        }
        
        // Java falla si falta el campo de segundos en el LocalDateTime.
        if (fechaHoraStr.length === 16) { 
           fechaHoraStr += ':00'; // "2026-03-23T08:30" -> "2026-03-23T08:30:00"
        }
        
        return {
          idBiometrico: idBio,
          fechaHora: fechaHoraStr,
          tipoRegistro: tipo,
          motivoEdicion: motivo || 'Edición autorizada por Admin',
          esManual: true
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.guardarManual(result.value).subscribe({
          next: () => {
            Swal.fire('Guardado', 'La marca manual se ha procesado exitosamente.', 'success');
            // Recargar automáticamente el reporte
            this.consultarHistorial();
          },
          error: () => {
            Swal.fire('Error', 'Hubo un problema comunicándose con el servidor para la marca manual.', 'error');
          }
        });
      }
    });
  }

  // Funciones de formateo UI
  formatHeaderDate(isoDate: string): string {
    const dt = DateTime.fromISO(isoDate).setLocale('es');
    return dt.toFormat("dd/MM/yyyy '('cccc')'"); 
  }

  formatTimeAMPM(timeStr: string): string {
    if (!timeStr) return '--:-- --';
    try {
      // 07:04:19.707067
      let partes = timeStr.split(':');
      if (partes.length < 2) return timeStr;
      
      let hora = parseInt(partes[0]);
      let min = partes[1]; // preserva 04
      
      let ampm = hora >= 12 ? 'PM' : 'AM';
      hora = hora % 12;
      hora = hora ? hora : 12; 
      
      return `${hora.toString().padStart(2,'0')}:${min} ${ampm}`;
    } catch {
      return timeStr.substring(0,5); 
    }
  }

  formatHoras(horasDecimales: number): string {
    if (!horasDecimales || isNaN(horasDecimales)) return '0h 0m';
    const h = Math.floor(horasDecimales);
    const m = Math.round((horasDecimales - h) * 60);
    return `${h}h ${m}m`;
  }

  get rangeDates(): string {
    const d = DateTime.fromJSDate(this.reportForm.value.desde).toFormat('dd/MM/yyyy');
    const h = DateTime.fromJSDate(this.reportForm.value.hasta).toFormat('dd/MM/yyyy');
    return `${d} al ${h}`;
  }
}
