import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Key
const supabaseUrl = 'https://sfdgcekmsbhwjdgsvygp.supabase.co';
const supabaseKey = 'sb_publishable_uu76bHzuC8Tdiq1fMLp7MA_fwMMkbOe';

export const supabase = createClient(supabaseUrl, supabaseKey);
