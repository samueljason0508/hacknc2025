import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aurrmnkokpucvlhoqqan.supabase.co/'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJtbmtva3B1Y3ZsaG9xcWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjM0NjgsImV4cCI6MjA3NTczOTQ2OH0.BvUUif2tAQpkY8gnIwZAE3PHQx0cDJWaRDyFRcTIYss'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
