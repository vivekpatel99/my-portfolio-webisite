import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdmpdzdqjskvaqcgyurn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbXBkemRxanNrdmFxY2d5dXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzUxMjYsImV4cCI6MjA3ODAxMTEyNn0.G3HwtLpyfBBCDYDBqrVUUjWLAmDrYpdqu_ao3bTgmBI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);