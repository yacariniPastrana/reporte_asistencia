export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  rol?: string;
  usuario?: string;
  [key: string]: any; // Payload adicional para retrocompatibilidad
}
