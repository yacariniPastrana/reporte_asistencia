export interface EmpleadoDTO {
  id: number;
  idBiometrico: string;
  nombreCompleto?: string;
  nombres?: string; // Para retrocompatibilidad
  nombre?: string; // Para retrocompatibilidad
  tipoDocumento?: string;
  numeroDocumento?: string;
  privilegio?: string;
  fechaCumpleanos?: string;
}
