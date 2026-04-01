import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Señal global para saber si la app está procesando una solicitud
  private loadingCount = 0;
  isLoading = signal<boolean>(false);

  show() {
    this.loadingCount++;
    if (this.loadingCount > 0) {
      this.isLoading.set(true);
    }
  }

  hide() {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.isLoading.set(false);
    }
  }
}
