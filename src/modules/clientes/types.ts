// Tipos del módulo Clientes (iguales a las tablas de Supabase).

export type EstadoPago = 'pagado' | 'pendiente' | 'abonado';

export const ESTADOS_PAGO: { id: EstadoPago; texto: string }[] = [
  { id: 'pagado', texto: 'Pagado' },
  { id: 'abonado', texto: 'Abonado' },
  { id: 'pendiente', texto: 'Pendiente' },
];

/** Tipos de servicio que trae la app de fábrica (el catálogo real vive en la base de datos). */
export const TIPOS_BASE = ['Cambio de aceite', 'Frenos', 'Transmisión', 'Suspensión', 'Afinación', 'Diagnóstico', 'Aire acondicionado', 'Eléctrico', 'Otro'];

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  notas: string | null;
  /** Etiquetas puestas a mano, por ejemplo "frecuente" */
  etiquetas: string[];
  creado_en: string;
}

export interface Vehiculo {
  id: string;
  cliente_id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  kilometraje_actual: number | null;
  notas: string | null;
  /** Recordatorio del próximo servicio (todo opcional) */
  proximo_servicio_nota: string | null;
  proximo_servicio_km: number | null;
  proximo_servicio_fecha: string | null;
}

export interface Servicio {
  id: string;
  vehiculo_id: string;
  cliente_id: string;
  /** Fecha sin hora: "2026-11-13" */
  fecha: string;
  tipo: string;
  descripcion: string | null;
  costo: number;
  kilometraje: number | null;
  estado_pago: EstadoPago;
  mecanico_id: string | null;
  notas: string | null;
  /** Rutas de las fotos en Storage */
  fotos: string[];
  creado_en: string;
}

/** Un cliente con sus vehículos y servicios vigentes (sin los eliminados). */
export interface ClienteCompleto extends Cliente {
  vehiculos: Vehiculo[];
  servicios: Servicio[];
}

export type DatosCliente = Omit<Cliente, 'id' | 'creado_en'>;
export type DatosVehiculo = Omit<Vehiculo, 'id' | 'cliente_id'>;
export type DatosServicio = Omit<Servicio, 'id' | 'cliente_id' | 'creado_en'>;

export interface TipoServicio {
  id: string;
  nombre: string;
  activo: boolean;
}

/** Contrato de datos del módulo: Supabase (real) o local (modo demostración). */
export interface RepoClientes {
  listar(): Promise<ClienteCompleto[]>;
  guardarCliente(datos: DatosCliente, id?: string): Promise<Cliente>;
  eliminarCliente(id: string): Promise<void>;
  guardarVehiculo(clienteId: string, datos: DatosVehiculo, id?: string): Promise<Vehiculo>;
  eliminarVehiculo(id: string): Promise<void>;
  guardarServicio(datos: DatosServicio, id?: string): Promise<Servicio>;
  eliminarServicio(id: string): Promise<void>;
  tipos(): Promise<TipoServicio[]>;
  agregarTipo(nombre: string): Promise<void>;
  activarTipo(id: string, activo: boolean): Promise<void>;
  subirFoto(foto: Blob): Promise<string>;
  urlFoto(ruta: string): Promise<string>;
}
