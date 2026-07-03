import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: orgUnits } = await supabase.from('org_units').select('id, name, parent_id, head_id, heads');
  const { data: emps } = await supabase.from('employees').select('id, first_name, last_name, employee_id, position, department, employment_classification');
  
  console.log("=== ORG UNITS ===");
  console.log(JSON.stringify(orgUnits, null, 2));
  
  console.log("\n=== KEY EMPLOYEES ===");
  const keyEmps = emps.filter(e => 
    e.position?.toLowerCase().includes('president') || 
    e.position?.toLowerCase().includes('vice') || 
    e.position?.toLowerCase().includes('vp') || 
    e.position?.toLowerCase().includes('dean') ||
    orgUnits.some(u => u.head_id === e.id || (u.heads && u.heads.some(h => h.employee_id === e.id)))
  );
  keyEmps.forEach(e => {
    console.log(`${e.first_name} ${e.last_name} (${e.employee_id}) - Dept: ${e.department} - Pos: ${e.position} - Class: ${e.employment_classification}`);
  });
}

check();
