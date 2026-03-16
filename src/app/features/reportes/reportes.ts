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
import { NgxPrintModule } from 'ngx-print';
import { ApiService } from '../../core/services/api.service';
import { DateTime } from 'luxon';
import Swal from 'sweetalert2';

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

  historial: any[] = [];
  isLoading = false;
  // IDs de columnas que DEBEN coincidir con el HTML
  displayedColumns: string[] = ['col-fecha', 'col-hora', 'col-empleado', 'col-documento', 'col-evento'];

  consultarHistorial(): void {
    if (this.reportForm.invalid) return;

    this.isLoading = true;
    const desdeStr = DateTime.fromJSDate(this.reportForm.value.desde).toFormat('yyyy-MM-dd');
    const hastaStr = DateTime.fromJSDate(this.reportForm.value.hasta).toFormat('yyyy-MM-dd');

    this.apiService.getHistorial(desdeStr, hastaStr).subscribe({
      next: (data) => {
        // Mapeamos los datos para asegurar que tengan los nombres que esperamos
        this.historial = data.map((item: any) => ({
          ...item,
          // Si no hay fecha en el item, usamos la del formulario como referencia
          fechaMostrada: item.fechaDia || item.fecha_dia || item.fecha || desdeStr,
          horaMostrada: item.hora || '---',
          empleadoMostrado: item.nombreEmpleado || '---',
          documentoMostrado: item.documento || '---',
          eventoMostrado: item.tipoRegistro || '---'
        }));

        this.isLoading = false;
        if (data.length === 0) {
          Swal.fire('Información', 'No se encontraron registros', 'info');
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'No se pudo obtener el historial.', 'error');
      }
    });
  }

  get rangeDates(): string {
    const d = DateTime.fromJSDate(this.reportForm.value.desde).toFormat('dd/MM/yyyy');
    const h = DateTime.fromJSDate(this.reportForm.value.hasta).toFormat('dd/MM/yyyy');
    return `${d} al ${h}`;
  }
}
