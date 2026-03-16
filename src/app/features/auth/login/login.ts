import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import anime from 'animejs';

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
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  hidePassword = true;

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
      const { username, password } = this.loginForm.value;
      if (username === 'USO001' && password === 'STE2027') {
        this.loginSuccess('cliente');
      } else if (username === 'STE001' && password === 'ADM1252') {
        this.loginSuccess('admin');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'Usuario o contraseña incorrectos',
          confirmButtonColor: '#3f51b5'
        });
      }
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
