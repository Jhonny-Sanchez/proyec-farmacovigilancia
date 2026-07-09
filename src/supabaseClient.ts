import { createClient } from '@supabase/supabase-js';

// Las variables de entorno (.env) tienen prioridad; si no existen se usan
// estos valores del proyecto. La clave "publishable" (anon) es pública por
// diseño: viaja en el navegador de cada usuario y la seguridad real la
// aplican las políticas RLS de la base de datos.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwtvuptqxphcprzaueb.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GdZz5fp1dmQACQkIb5Ry7w_iMnZVhzC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
