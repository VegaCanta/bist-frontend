import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hgymlrwirhnygtmskeij.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneW1scndpcmhueWd0bXNrZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDgxNzAsImV4cCI6MjA5Mzk4NDE3MH0.J3iatlrGLGSoZIxyTjYF1rez2A2nOPMeCMkUD8z_eF8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)