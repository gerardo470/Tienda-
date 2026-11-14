import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Si faltan las claves de Supabase la app funciona en "modo demostración":
 * todo se guarda solo en este teléfono, sin inicio de sesión.
 */
export const modoDemo = !url || !key || url.includes('SU-PROYECTO');

export const supabase: SupabaseClient | null = modoDemo
  ? null
  : createClient(url!, key!, {
      auth: {
        persistSession: true, // la sesión queda guardada en el teléfono
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'llavecita-auth',
      },
    });
