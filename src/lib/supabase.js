/**
 * Client centralizzato Supabase per Brilla Cafe.
 * Resiliente a build statiche e runtime senza crash se le chiavi .env non sono ancora state configurate.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
