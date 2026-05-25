import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { computeAge, computeYearsInService } from './apps/web/src/utils/benefitsEngine.js';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: emps, error } = await supabase.from('employees').select('*').eq('is_active', true);
  if (error) {
    console.error(error);
    return;
  }
  
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const may31 = new Date(Date.UTC(currentYear, 4, 31));
  
  console.log(`\nActive Employees list and their computed values:`);
  emps.forEach(emp => {
    const age = emp.birthdate ? computeAge(emp.birthdate, may31) : 'null';
    const yis = emp.date_hired ? computeYearsInService(emp.date_hired, may31) : 'null';
    
    console.log(`- ${emp.first_name} ${emp.last_name}: birthdate=${emp.birthdate} (age=${age}), date_hired=${emp.date_hired} (yis=${yis})`);
  });
}

check();
