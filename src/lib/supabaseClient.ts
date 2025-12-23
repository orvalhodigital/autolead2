
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aurqzgpastfertawztbb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnF6Z3Bhc3RmZXJ0YXd6dGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTA1MjksImV4cCI6MjA4MjA2NjUyOX0.8lwMffFkbYEy9D7-Q28UoRqK2l4vMUewOOvOrmsgN8E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
