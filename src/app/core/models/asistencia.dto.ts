export interface AsistenciaDTO {
  id?: number;
  idBio?: string;
  empleadoId?: number;
  idBiometrico?: string; // Por retrocompatibilidad con la app actual
  nombreEmpleado?: string;
  documento?: string;
  tipoRegistro: string;
  hora: string;
  fecha: string;
  horasTrabajadas?: number;
}
