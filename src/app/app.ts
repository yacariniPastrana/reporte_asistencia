import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading.service';
import { LoaderLogoComponent } from './shared/components/loader-logo/loader-logo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderLogoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  loadingService = inject(LoadingService);
  protected readonly title = signal('biometrico-st-enterprise');
}

