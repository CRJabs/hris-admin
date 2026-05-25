import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking active employees and birthday_bonus details...");
  
  // Fetch active employees
  const { data: emps, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true);
  if (empError) {
    console.error("Employee fetch error:", empError);
    return;
  }
  
  // Fetch benefits for birthday_bonus
  const { data: bens, error: benError } = await supabase
    .from('employee_benefits')
    .select('*')
    .eq('benefit_key', 'birthday_bonus');
  if (benError) {
    console.error("Benefits fetch error:", benError);
    return;
  }
  
  const bensMap = bens.reduce((acc, b) => {
    acc[b.employee_id] = b;
    return acc;
  }, {});
  
  console.log(`\nActive employees in database: ${emps.length}`);
  
  console.log("\n--- Active Employees with Non-Null Birthdates ---");
  emps.forEach(emp => {
    if (emp.birthdate) {
      const ben = bensMap[emp.id];
      console.log(`Name: ${emp.first_name} ${emp.last_name}`);
      console.log(`UUID: ${emp.id}`);
      console.log(`Employee ID: ${emp.employee_id}`);
      console.log(`Birthdate: ${emp.birthdate}`);
      console.log(`Date Hired: ${emp.date_hired}`);
      console.log(`Is Eligible (in DB): ${ben ? ben.is_eligible : 'NO RECORD'}`);
      if (ben) {
        console.log(`Computed At: ${ben.computed_at}`);
        console.log(`Year: ${ben.eligibility_year}`);
      }
      console.log("--------------------------------");
    }
  });
}

check();
