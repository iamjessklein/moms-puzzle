import { createClient } from '@supabase/supabase-js'

// !! FILL THESE IN after you create your Supabase project !!
// You'll find them at: supabase.com → your project → Settings → API
const SUPABASE_URL = 'moms-puzzle/src/supabase.js
const SUPABASE_ANON_KEY = 'sb_publishable_3tVPyjhf7YUaMyfV_IfDZw_GAioteAt'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
