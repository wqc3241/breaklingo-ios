import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://evmamwdmwogmlezndueg.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bWFtd2Rtd29nbWxlem5kdWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1NjcsImV4cCI6MjA2NTUzMDU2N30.c5UTSaA5p9-7cD4HnizalfZUHjFZijmSpuET98YgTA0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
