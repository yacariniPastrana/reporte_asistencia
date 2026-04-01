import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../core/services/api.service';
import Chart from 'chart.js/auto';
import { DateTime } from 'luxon';
import { AsistenciaDTO } from '../../core/models/asistencia.dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatListModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  
  @ViewChild('statsChart') statsChart!: ElementRef;
  private chartInstance: Chart | null = null;

  asistencias: AsistenciaDTO[] = [];
  isLoading = true;
  isRefreshing = false;
  error: string | null = null;
  
  // Rate limiting properties
  refreshCount = 0;
  cooldownEnd: Date | null = null;
  
  fechaHoy = new Date();
  displayedColumns: string[] = ['empleado', 'documento', 'tipo', 'fecha_hora'];

  stats = {
    total: 0,
    ingresos: 0,
    refrigerioIn: 0,
    refrigerioOut: 0, // Mantenemos propiedad por compatibilidad de visualización
    salidas: 0
  };

  cumpleanosMes: any[] = [];

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarCumpleanos();
  }

  cargarCumpleanos(): void {
    this.apiService.getEmpleados().subscribe({
      next: (empleados) => {
        const mesActual = DateTime.now().month;
        const colores = ['#ff4081', '#3f51b5', '#4caf50', '#ff9800', '#00bcd4', '#9c27b0'];
        
        let proximos = empleados
          .filter(e => e.fechaCumpleanos)
          .map(e => {
            const dt = DateTime.fromISO(e.fechaCumpleanos!).setLocale('es');
            return {
              nombre: e.nombreCompleto || e.nombres || e.nombre,
              fecha: dt.toFormat('dd \'de\' MMMM'), // Ej: "15 de mayo"
              mes: dt.month,
              dia: dt.day,
              iniciales: this.obtenerIniciales(e.nombreCompleto! || e.nombres! || 'User'),
              color: colores[Math.floor(Math.random() * colores.length)]
            };
          })
          .filter(e => e.mes === mesActual) // Solo los que cumplen en este mismo mes
          .sort((a, b) => a.dia - b.dia);   // Ordenar del que cumple primero al último del mes
        
        this.cumpleanosMes = proximos;
      }
    });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.apiService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.procesarStats(data);
        this.isLoading = false;
        setTimeout(() => this.updateOrCreateChart(), 100);
      },
      error: () => {
        this.error = "Error al cargar datos.";
        this.isLoading = false;
      }
    });
  }

  cargarDatosSilencioso(): void {
    this.isRefreshing = true;
    this.apiService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.procesarStats(data);
        this.updateOrCreateChart();
        this.isRefreshing = false;
      },
      error: () => {
        this.isRefreshing = false;
      }
    });
  }

  manualRefresh(): void {
    if (this.isRefreshing) return;

    if (this.cooldownEnd && new Date() < this.cooldownEnd) {
      const remainingMi = Math.ceil((this.cooldownEnd.getTime() - new Date().getTime()) / 60000);
      Swal.fire({
        icon: 'warning',
        title: 'Refresco Bloqueado',
        text: `Has alcanzado el límite de recargas manuales (Anti-Abuso). Por favor, intenta de nuevo en ${remainingMi} minutos.`,
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    this.refreshCount++;
    if (this.refreshCount >= 5) {
      // Set a 1-hour cooldown
      this.cooldownEnd = new Date(new Date().getTime() + 60 * 60 * 1000);
      this.refreshCount = 0; 
    }

    this.cargarDatosSilencioso();
  }

  procesarStats(data: AsistenciaDTO[]): void {
    // Agrupación por empleado con todas sus marcas
    const empleadosMap = new Map<string, AsistenciaDTO[]>();
    
    data.forEach(a => {
      const key = a.documento || a.idBiometrico || String(a.empleadoId);
      if (!empleadosMap.has(key)) {
        empleadosMap.set(key, []);
      }
      empleadosMap.get(key)!.push(a);
    });

    let soloIngresos = 0;
    let salidasCompletas = 0;
    let enRefrigerio = 0;

    empleadosMap.forEach(marcas => {
      // Orden cronológico estricto de las marcas del día para ese empleado
      marcas.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
      const cantidad = marcas.length;
      
      if (cantidad === 0) return;

      if (cantidad === 1) {
        // [1] Primera marca: Mantenido en el cuadro de ingreso (Pendiente)
        soloIngresos++;
      } else if (cantidad === 2) {
        // [2] Segunda marca: Inicialmente refrigerio, pero aplicamos la regla condicional
        const horaStr = marcas[1].hora || '00:00:00';
        const horaFin = parseInt(horaStr.split(':')[0], 10) || 0;
        
        // Si la segunda marca superó la hora del almuerzo (ej. 15:00 hrs o más) asume salida.
        if (horaFin >= 15) {
          salidasCompletas++;
        } else {
          enRefrigerio++;
        }
      } else if (cantidad === 3) {
        // [3] Tercera marca: Fin del refrigerio, retornó al trabajo (vuelve a Pendientes)
        soloIngresos++;
      } else if (cantidad >= 4) {
        // [4+] Cuarta marca a más: Salida laboral consolidada
        salidasCompletas++;
      }
    });

    this.stats.total = empleadosMap.size;
    this.stats.ingresos = soloIngresos;
    this.stats.salidas = salidasCompletas;
    this.stats.refrigerioIn = enRefrigerio;
    this.stats.refrigerioOut = 0; 
  }

  updateOrCreateChart(): void {
    if (!this.statsChart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Calculamos faltante en caso haya algo raro pero con logica unica debe ser 0.
    const asignados = this.stats.ingresos + this.stats.refrigerioIn + this.stats.refrigerioOut + this.stats.salidas;
    const otros = this.stats.total > asignados ? this.stats.total - asignados : 0;

    this.chartInstance = new Chart(this.statsChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes (Solo Ingreso)', 'En Refrigerio', 'Completados (Salidas)', 'Otros'],
        datasets: [{
          data: [
            this.stats.ingresos,
            this.stats.refrigerioIn + this.stats.refrigerioOut,
            this.stats.salidas,
            otros
          ],
          backgroundColor: ['#3f51b5', '#ff4081', '#4caf50', '#ffc107'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  formatTime(isoDate: string): string {
    if (!isoDate) return '---';
    return DateTime.fromISO(isoDate).setZone('America/Lima').toFormat('HH:mm:ss');
  }
}
