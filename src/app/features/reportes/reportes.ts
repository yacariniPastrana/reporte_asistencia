import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxPrintModule } from 'ngx-print';
import { ApiService } from '../../core/services/api.service';

import { DateTime } from 'luxon';
import Swal from 'sweetalert2';
import { from, of } from 'rxjs';
import { catchError, map, mergeMap, toArray } from 'rxjs/operators';

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
    MatTooltipModule,
    NgxPrintModule
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class ReportesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

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
  private empleadosCargados = false;

  ngOnInit() {
    // Los empleados se cargan lazily antes de la primera consulta
    // para no despertar el servidor en frío al entrar a la pantalla
  }

  consultarHistorial(): void {
    if (this.reportForm.invalid) return;
    this.isLoading = true;

    // Cargar empleados lazily la primera vez (no en ngOnInit)
    const ejecutar = () => {
      const desde = DateTime.fromJSDate(this.reportForm.value.desde);
      const hasta = DateTime.fromJSDate(this.reportForm.value.hasta);

      this.dateColumns = [];
      let currentDate = desde;
      while (currentDate <= hasta) {
        this.dateColumns.push(currentDate.toFormat('yyyy-MM-dd'));
        currentDate = currentDate.plus({ days: 1 });
      }

      this.displayedColumns = ['col-empleado', ...this.dateColumns, 'col-total'];

      this.dataSource = this.empleados.map(emp => ({
        idBiometrico: emp.idBiometrico || emp.id,
        nombreEmpleado: emp.nombreCompleto || emp.nombre || emp.nombres || 'Emp ' + (emp.idBiometrico || emp.id),
        totalHoras: 0,
        dias: {}
      }));

      // Construir lista plana de tareas { indexRow, fecha }
      const tareas: { indexRow: number; fecha: string }[] = [];
      for (let idx = 0; idx < this.dataSource.length; idx++) {
        for (const fechaStr of this.dateColumns) {
          tareas.push({ indexRow: idx, fecha: fechaStr });
        }
      }

      if (tareas.length === 0) {
        this.isLoading = false;
        return;
      }

      // ⚡ Concurrencia controlada: máximo 5 peticiones simultáneas
      // En vez de disparar N*M peticiones en paralelo (que satura el servidor),
      // procesamos de a 5 a la vez para proteger los recursos del backend.
      from(tareas).pipe(
        mergeMap(
          ({ indexRow, fecha }) =>
            this.apiService.procesarDia(this.dataSource[indexRow].idBiometrico, fecha).pipe(
              catchError(() => of(null)),
              map(res => ({ indexRow, fecha, data: res }))
            ),
          5 // concurrencia máxima = 5
        ),
        toArray(),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (resultados) => {
          let registrosUtiles = 0;
          for (const res of resultados) {
            if (res && res.data && Object.keys(res.data).length > 0) {
              registrosUtiles++;
              this.dataSource[res.indexRow].dias[res.fecha] = res.data;
              this.dataSource[res.indexRow].totalHoras += Number(res.data.horasTrabajadas || 0);
            }
          }
          this.dataSource = [...this.dataSource];
          this.isLoading = false;
          if (registrosUtiles === 0) {
            Swal.fire('Información', 'No se detectaron marcas para ningún empleado en este periodo.', 'info');
          }
        },
        error: () => {
          this.isLoading = false;
          Swal.fire('Error', 'Hubo un fallo calculando la red de asistencias.', 'error');
        }
      });
    };

    if (this.empleadosCargados) {
      ejecutar();
    } else {
      this.apiService.getEmpleados()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (emps) => {
            this.empleados = emps;
            this.empleadosCargados = true;
            ejecutar();
          },
          error: () => {
            this.isLoading = false;
            Swal.fire('Error', 'No se pudieron cargar los empleados.', 'error');
          }
        });
    }
  }

  // ── ANULAR MARCA INDIVIDUAL (solo admin) ─────────────────────────────────
  // En vez de eliminar el registro, envía fechaHora = null para que quede como ---
  async abrirBorrarMarcaIndividual(
    idBiometrico?: string,
    fecha?: string,
    nombreEmpleado?: string
  ): Promise<void> {
    if (this.empleados.length === 0) return;

    const opcionesHtml = this.empleados.map(emp =>
      `<option value="${emp.idBiometrico || emp.id}" ${(emp.idBiometrico || emp.id) === idBiometrico ? 'selected' : ''}>${emp.nombreCompleto || emp.nombre || emp.nombres}</option>`
    ).join('');

    const hoy = new Date().toISOString().split('T')[0];

    const { value: formValues, isConfirmed } = await Swal.fire({
      title: '🗑️ Anular una Marca',
      width: '620px',
      html: `
        <style>
          .sb-input { box-sizing:border-box; width:100%; margin:4px 0 14px; padding:0 12px;
            height:44px; font-size:1rem; border:1px solid #ccc; border-radius:4px; background:#fff; }
          .sb-input:focus { outline:none; border-color:#e53935; }
          .sb-label { font-weight:600; font-size:0.9em; text-align:left; display:block; color:#333; }
          .sb-info { background:#fff3e0; border-left:4px solid #ff9800; padding:10px 14px;
            border-radius:4px; margin-bottom:16px; font-size:0.85rem; color:#e65100; text-align:left; }
        </style>
        <div style="text-align:left; padding: 0 10px;">
          <div class="sb-info">
            ⚠️ Esta acción pondrá la marca seleccionada en <strong>---</strong> (nulo).
            El registro del empleado permanece, pero ese horario quedará vacío.
          </div>

          <label class="sb-label">Empleado</label>
          <select id="del-empleado" class="sb-input">${opcionesHtml}</select>

          <label class="sb-label">Fecha</label>
          <input id="del-fecha" type="date" class="sb-input" value="${fecha || hoy}" max="${hoy}">

          <label class="sb-label">Marca a anular</label>
          <select id="del-tipo" class="sb-input">
            <option value="INGRESO LABORAL">INGRESO LABORAL</option>
            <option value="INICIO REFRIGERIO">INICIO REFRIGERIO</option>
            <option value="FIN REFRIGERIO">FIN REFRIGERIO</option>
            <option value="SALIDA LABORAL">SALIDA LABORAL</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Anular Marca',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53935',
      icon: 'warning',
      focusCancel: true,
      preConfirm: () => {
        const idBio = (document.getElementById('del-empleado') as HTMLSelectElement).value;
        const fechaVal = (document.getElementById('del-fecha') as HTMLInputElement).value;
        const tipo = (document.getElementById('del-tipo') as HTMLSelectElement).value;
        if (!fechaVal) { Swal.showValidationMessage('La fecha es obligatoria'); return; }
        return { idBio, fecha: fechaVal, tipo };
      }
    });

    if (!isConfirmed || !formValues) return;

    // Confirmación final
    const { isConfirmed: confirmado } = await Swal.fire({
      title: 'Confirmar anulación',
      html: `¿Anular la marca <strong>${formValues.tipo}</strong> del <strong>${formValues.fecha}</strong>?<br><small style="color:#777">Quedará como <strong>---</strong> en el reporte.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53935',
    });

    if (!confirmado) return;

    // Construir payload con fechaHora null para anular la marca
    // Se usa el mismo endpoint guardarManual con el campo de hora en null
    const payload = {
      idBiometrico: formValues.idBio,
      fechaHora: null,                 // null = anular / poner ---
      tipoRegistro: formValues.tipo,
      fecha: formValues.fecha,
      motivoEdicion: 'Anulación autorizada por Administrador',
      esManual: true,
      anular: true                     // flag explícito para el backend
    };

    this.apiService.guardarManual(payload).subscribe({
      next: () => {
        Swal.fire('✅ Marca anulada', `La marca "${formValues.tipo}" del ${formValues.fecha} fue anulada. Aparecerá como --- en el reporte.`, 'success');
        this.consultarHistorial();
      },
      error: () => Swal.fire('Error', 'No se pudo anular la marca. Intenta de nuevo o contacta al soporte técnico.', 'error')
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
