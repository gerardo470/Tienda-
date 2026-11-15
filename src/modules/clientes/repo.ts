import { supabase } from '../../lib/supabase';
import { crearRepoLocal } from './repo.local';
import { crearRepoSupabase } from './repo.supabase';
import type { RepoClientes } from './types';

/** Con claves de Supabase usa la nube; sin ellas, el modo demostración. */
export const repoClientes: RepoClientes = supabase ? crearRepoSupabase(supabase) : crearRepoLocal();
