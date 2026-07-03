import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_id, department, position, org_unit_id, employment_classification");
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("=== EMPLOYEES ===");
  employees.forEach(e => {
    console.log(`Name: ${e.first_name} ${e.last_name} | Dept: ${e.department} | Classification: ${e.employment_classification} | Unit ID: ${e.org_unit_id}`);
  });
}

check();
