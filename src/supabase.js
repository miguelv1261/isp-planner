import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zbefymgchlmoiojlisxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZWZ5bWdjaGxtb2lvamxpc3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODUyMjMsImV4cCI6MjA4OTg2MTIyM30.vxR_s0WUCPWSrgl-7YUeVqRfctAMbTuWNhHHftC2sTo'
)