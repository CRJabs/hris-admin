import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: emps } = await supabase.from('employees').select('*').limit(1);
  if (emps && emps[0]) {
    console.log("Employee columns:", Object.keys(emps[0]));
    console.log("Sample employee details:", emps[0]);
  } else {
    console.log("No employees found");
  }
}

check();
