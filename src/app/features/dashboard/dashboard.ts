import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  
  @ViewChild('statsChart') statsChart!: ElementRef;

  asistencias: any[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Variable para mostrar la fecha actual en la cabecera
  fechaHoy = new Date();

  displayedColumns: string[] = ['empleado', 'documento', 'tipo', 'fecha_hora'];

  stats = {
    total: 0,
    ingresos: 0,
    refrigerios: 0,
    salidas: 0
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.apiService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.procesarStats(data);
        this.isLoading = false;
        setTimeout(() => this.initChart(), 100);
      },
      error: (err) => {
        this.error = "Error al cargar datos.";
        this.isLoading = false;
      }
    });
  }

  procesarStats(data: any[]): void {
    this.stats.total = data.length;
    this.stats.ingresos = data.filter(a => a.tipoRegistro?.includes('INGRESO')).length;
    this.stats.refrigerios = data.filter(a => a.tipoRegistro?.includes('REFRIGERIO')).length;
    this.stats.salidas = data.filter(a => a.tipoRegistro?.includes('SALIDA')).length;
  }

  initChart(): void {
    if (!this.statsChart) return;

    new Chart(this.statsChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Refrigerios', 'Salidas', 'Otros'],
        datasets: [{
          data: [
            this.stats.ingresos,
            this.stats.refrigerios,
            this.stats.salidas,
            this.stats.total - (this.stats.ingresos + this.stats.refrigerios + this.stats.salidas)
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
