import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);

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
    refrigerioOut: 0,
    salidas: 0
  };

  cumpleanosMes: any[] = [];

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarCumpleanos();
  }

  cargarCumpleanos(): void {
    this.apiService.getEmpleados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (empleados) => {
          const mesActual = DateTime.now().month;
          const colores = ['#ff4081', '#3f51b5', '#4caf50', '#ff9800', '#00bcd4', '#9c27b0'];
          this.cumpleanosMes = empleados
            .filter(e => e.fechaCumpleanos)
            .map(e => {
              const dt = DateTime.fromISO(e.fechaCumpleanos!).setLocale('es');
              return {
                nombre: e.nombreCompleto || e.nombres || e.nombre,
                fecha: dt.toFormat("dd 'de' MMMM"),
                mes: dt.month,
                dia: dt.day,
                iniciales: this.obtenerIniciales(e.nombreCompleto! || e.nombres! || 'User'),
                color: colores[Math.floor(Math.random() * colores.length)]
              };
            })
            .filter(e => e.mes === mesActual)
            .sort((a, b) => a.dia - b.dia);
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
    this.apiService.getAsistenciasHoy()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.asistencias = data.slice().sort((a, b) => {
            const dtA = (a.fecha ?? '') + 'T' + (a.hora ?? '');
            const dtB = (b.fecha ?? '') + 'T' + (b.hora ?? '');
            return dtB.localeCompare(dtA); // descendente: más reciente primero
          });
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
    this.apiService.getAsistenciasHoy()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.asistencias = data.slice().sort((a, b) => {
            const dtA = (a.fecha ?? '') + 'T' + (a.hora ?? '');
            const dtB = (b.fecha ?? '') + 'T' + (b.hora ?? '');
            return dtB.localeCompare(dtA); // descendente: más reciente primero
          });
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
    // Conteo directo por tipoRegistro tal como lo registra el biométrico
    let ingresos = 0;
    let refrigerioIn = 0;
    let refrigerioOut = 0;
    let salidas = 0;

    data.forEach(a => {
      const tipo = (a.tipoRegistro || '').toLowerCase().trim();

      if (tipo.includes('ingreso')) {
        ingresos++;
      } else if (tipo.includes('inicio') || tipo.includes('salida refr')) {
        refrigerioIn++;
      } else if (tipo.includes('fin') || tipo.includes('regreso') || tipo.includes('retorno')) {
        refrigerioOut++;
      } else if (tipo.includes('salida')) {
        salidas++;
      }
    });

    this.stats.total = data.length;
    this.stats.ingresos = ingresos;
    this.stats.refrigerioIn = refrigerioIn;
    this.stats.refrigerioOut = refrigerioOut;
    this.stats.salidas = salidas;
  }

  updateOrCreateChart(): void {
    if (!this.statsChart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(this.statsChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Ingreso Laboral', 'Inicio Refrigerio', 'Fin Refrigerio', 'Salida Laboral'],
        datasets: [{
          data: [
            this.stats.ingresos,
            this.stats.refrigerioIn,
            this.stats.refrigerioOut,
            this.stats.salidas
          ],
          backgroundColor: ['#3f51b5', '#ff9800', '#4caf50', '#f44336'],
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
