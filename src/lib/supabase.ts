import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://peubpisofenlyquqnpan.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEyMDI0MDYsImV4cCI6MjAxNjc3ODQwNn0.BdBSItWJLSg8l0d8-YBl2g2vw4j3smnBbQhcKdJjGFY'

export const supabase = createClient(supabaseUrl, supabaseKey)
