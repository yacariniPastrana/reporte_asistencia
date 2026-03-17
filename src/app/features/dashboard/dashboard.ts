import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import Chart from 'chart.js/auto';
import { DateTime } from 'luxon';

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
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  
  @ViewChild('statsChart') statsChart!: ElementRef;
  private chartInstance: Chart | null = null;

  asistencias: any[] = [];
  isLoading = true;
  isRefreshing = false;
  error: string | null = null;
  private refreshTimer: any;
  
  // Variable para mostrar la fecha actual en la cabecera
  fechaHoy = new Date();

  displayedColumns: string[] = ['empleado', 'documento', 'tipo', 'fecha_hora'];

  stats = {
    total: 0,
    ingresos: 0,
    refrigerioIn: 0,
    refrigerioOut: 0,
    salidas: 0
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  // Carga inicial o manual pesada (muestra spinner que bloquea pantalla)
  cargarDatos(): void {
    this.isLoading = true;
    this.apiService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.procesarStats(data);
        this.isLoading = false;
        setTimeout(() => this.updateOrCreateChart(), 100);
      },
      error: (err) => {
        this.error = "Error al cargar datos.";
        this.isLoading = false;
      }
    });
  }

  // Carga liviana en segundo plano para el intervalo o el botón manual rápido
  cargarDatosSilencioso(): void {
    this.isRefreshing = true;
    this.apiService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.procesarStats(data);
        this.updateOrCreateChart();
        this.isRefreshing = false;
      },
      error: (err) => {
        this.isRefreshing = false;
      }
    });
  }

  // Llamado por el botón manual de recargar
  manualRefresh(): void {
    if(!this.isRefreshing) {
      this.cargarDatosSilencioso();
    }
  }

  procesarStats(data: any[]): void {
    this.stats.total = data.length;
    this.stats.ingresos = data.filter(a => a.tipoRegistro?.includes('INGRESO')).length;
    this.stats.refrigerioIn = data.filter(a => a.tipoRegistro?.includes('INICIO REFRIGERIO')).length;
    this.stats.refrigerioOut = data.filter(a => a.tipoRegistro?.includes('FIN REFRIGERIO')).length;
    this.stats.salidas = data.filter(a => a.tipoRegistro?.includes('SALIDA')).length;
  }

  updateOrCreateChart(): void {
    if (!this.statsChart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(this.statsChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Refrigerios', 'Salidas', 'Otros'],
        datasets: [{
          data: [
            this.stats.ingresos,
            this.stats.refrigerioIn + this.stats.refrigerioOut,
            this.stats.salidas,
            this.stats.total - (this.stats.ingresos + this.stats.refrigerioIn + this.stats.refrigerioOut + this.stats.salidas)
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
