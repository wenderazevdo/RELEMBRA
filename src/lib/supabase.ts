import {createClient} from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY
// A anon key é pública por design; a segurança vem do RLS. Nunca use a service_role aqui.
export const supabase = url && key ? createClient(url, key) : null
