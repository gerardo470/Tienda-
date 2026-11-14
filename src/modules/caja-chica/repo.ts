import { supabase } from '../../lib/supabase';
import { crearRepoLocal } from './repo.local';
import { crearRepoSupabase } from './repo.supabase';
import type { RepoCaja } from './types';

/** Con claves de Supabase usa la nube; sin ellas, el modo demostración. */
export const repoCaja: RepoCaja = supabase ? crearRepoSupabase(supabase) : crearRepoLocal();
