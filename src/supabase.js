/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iskwvbwowfzhdbniwncd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlza3d2Yndvd2Z6aGRibml3bmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODg0ODksImV4cCI6MjA5NTg2NDQ4OX0.EZWKUrqjdBaDJInDpYmjhDYJfFPN0t5fCFKhK8gmbDc';

export const supabase = createClient(supabaseUrl, supabaseKey);
