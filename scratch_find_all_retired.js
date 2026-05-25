import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { computeAge, computeYearsInService } from './apps/web/src/utils/benefitsEngine.js';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: emps, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const may31 = new Date(Date.UTC(currentYear, 4, 31));
  
  console.log(`\nAll Employees (Active and Inactive) in DB: ${emps.length}`);
  emps.forEach(emp => {
    const age = emp.birthdate ? computeAge(emp.birthdate, may31) : 0;
    const yis = emp.date_hired ? computeYearsInService(emp.date_hired, may31) : 0;
    
    // Check if they are aged 58 and have 26 years in service, or similar
    if ((age >= 55 && age <= 65) || (yis >= 20 && yis <= 30)) {
      console.log(`- ${emp.first_name} ${emp.last_name}: UUID=${emp.id}, active=${emp.is_active}, birthdate=${emp.birthdate} (age=${age}), date_hired=${emp.date_hired} (yis=${yis})`);
    }
  });
}

check();
