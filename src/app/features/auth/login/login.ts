import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import anime from 'animejs';
import { ApiService } from '../../../core/services/api.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  hidePassword = true;
  isConnectingBackend = false;

  ngAfterViewInit(): void {
    anime({
      targets: '.top-logo svg path',
      opacity: [0, 1],
      translateY: [20, 0], // Evitamos usar 'scale' porque el SVG ya tiene sus propias escalas matemáticas y AnimeJS las borraría
      duration: 1000,
      delay: anime.stagger(100),
      endDelay: 7000, // <--- 7000 milisegundos (7 segundos) de pausa antes de volver a empezar el ciclo
      easing: 'easeOutElastic(1, .8)',
      loop: true,        // Hace que la animación se repita infinitamente
      direction: 'alternate' // Hace que se arme y se desarme fluidamente
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isConnectingBackend = true;
      const { username, password } = this.loginForm.value;
      const apiPayload = { usuario: username, password };
      
      this.apiService.login(apiPayload).subscribe({
        next: (response) => {
          this.isConnectingBackend = false;
          // Asumimos que el backend retorna al menos { rol: 'ADMIN' } o similar
          // Validamos y guardamos (ajustaremos la lectura del rol según el JSON devuelto si difiere)
          const rol = response.rol || (username === 'Adm' ? 'admin' : 'cliente');
          
          this.loginSuccess(rol.toLowerCase());
        },
        error: (err) => {
          this.isConnectingBackend = false;
          Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Usuario o contraseña incorrectos, o el servidor no responde.',
            confirmButtonColor: '#3f51b5'
          });
        }
      });
    }
  }

  private loginSuccess(role: string): void {
    localStorage.setItem('user_role', role);
    localStorage.setItem('is_logged_in', 'true');
    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Ingresando como ${role.toUpperCase()}`,
      timer: 1500,
      showConfirmButton: false
    }).then(() => this.router.navigate(['/dashboard']));
  }
}
