import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './empleados.html',
  styleUrl: './empleados.scss'
})
export class EmpleadosComponent implements OnInit {
  private apiService = inject(ApiService);

  empleados: any[] = [];
  filteredEmpleados: any[] = [];
  isLoading = true;
  searchTerm = '';
  isAdmin = localStorage.getItem('user_role') === 'admin';

  displayedColumns: string[] = ['id_biometrico', 'nombre', 'documento', 'acciones'];

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.isLoading = true;
    this.apiService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.filteredEmpleados = data;
        this.isLoading = false;
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudieron cargar los empleados. Reintentando...', 'error');
        setTimeout(() => this.cargarEmpleados(), 5000);
      }
    });
  }

  filter(value: string): void {
    this.searchTerm = value.toLowerCase();
    this.filteredEmpleados = this.empleados.filter(e => 
      e.nombreCompleto.toLowerCase().includes(this.searchTerm) || 
      e.idBiometrico?.toString().includes(this.searchTerm) ||
      e.numeroDocumento?.includes(this.searchTerm)
    );
  }

  async editarDocumento(empleado: any): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Actualizar Documento',
      html:
        `<label>Tipo de Documento</label>` +
        `<select id="swal-input1" class="swal2-input">
          <option value="DNI" ${empleado.tipoDocumento === 'DNI' ? 'selected' : ''}>DNI</option>
          <option value="CE" ${empleado.tipoDocumento === 'CE' ? 'selected' : ''}>CE</option>
          <option value="RUC" ${empleado.tipoDocumento === 'RUC' ? 'selected' : ''}>RUC</option>
        </select>` +
        `<label>Número de Documento</label>` +
        `<input id="swal-input2" class="swal2-input" placeholder="Ingrese número" value="${empleado.numeroDocumento || ''}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      confirmButtonColor: '#3f51b5',
      preConfirm: () => {
        const tipo = (document.getElementById('swal-input1') as HTMLSelectElement).value;
        const numero = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!numero) {
          Swal.showValidationMessage('El número de documento es obligatorio');
        }
        return { tipo, numero };
      }
    });

    if (formValues) {
      this.isLoading = true;
      this.apiService.updateDocumento(empleado.id, formValues.tipo, formValues.numero).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Documento actualizado correctamente', 'success');
          this.cargarEmpleados(); // Recargar lista
        },
        error: () => {
          this.isLoading = false;
          Swal.fire('Error', 'No se pudo actualizar el documento', 'error');
        }
      });
    }
  }
}
