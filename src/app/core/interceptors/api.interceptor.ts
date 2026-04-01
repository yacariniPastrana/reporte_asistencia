import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize, timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ErrorResponse } from '../models/error.response';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Activa el spinner global (Render Cold Start o peticiones normales)
  loadingService.show();

  return next(req).pipe(
    // 45 segundos de timeout para compensar la hibernación de Render
    timeout(45000),
    catchError((error: any) => {
      let errorMsg = 'Ocurrió un error inesperado al conectar con el servidor.';
      
      if (error?.error instanceof ErrorEvent) {
        // Error del lado del cliente / Red
        errorMsg = `Error de red: ${error.error.message}`;
      } else if (error?.status === 0 || error?.name === 'TimeoutError') {
         // Timeout por cold start muy largo o caída de internet
         errorMsg = 'El servidor está tardando mucho en responder (Posible reactivación). Por favor intenta de nuevo.';
      } else if (error.error) {
        // Error parseado con el formato DTO del Backend (ErrorResponse)
        const backError = error.error as ErrorResponse;
        errorMsg = backError.message || error.message;
      }

      // Alerta centralizada
      Swal.fire({
        icon: 'error',
        title: 'Error del Sistema',
        text: errorMsg,
        confirmButtonColor: '#3f51b5'
      });

      return throwError(() => new Error(errorMsg));
    }),
    finalize(() => {
      // Independientemente de que haya error o acierto, ocultamos el spinner
      loadingService.hide();
    })
  );
};
