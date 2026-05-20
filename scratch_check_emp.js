import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: emps } = await supabase.from('employees').select('id, employee_id').eq('is_active', true);
  const { data: bens } = await supabase.from('employee_benefits').select('employee_id, benefit_key');
  
  const empIdsWithBens = new Set(bens.map(b => b.employee_id));
  
  const missing = emps.filter(e => !empIdsWithBens.has(e.id));
  
  console.log(`Total Active Employees: ${emps.length}`);
  console.log(`Employees missing from benefits: ${missing.length}`);
  console.log(`Missing Employee IDs: ${missing.map(m => m.employee_id).join(', ')}`);
}

check();
