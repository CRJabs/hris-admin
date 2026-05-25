import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { computeAge, computeYearsInService, computeBenefitsEligibility } from './apps/web/src/utils/benefitsEngine.js';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking active employees for retirement eligibility...");
  
  // 1. Fetch active employees
  const { data: emps, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true);
  if (empError) {
    console.error("Employee fetch error:", empError);
    return;
  }
  
  // 2. Fetch employee benefits for retirement key
  const { data: bens, error: benError } = await supabase
    .from('employee_benefits')
    .select('*')
    .eq('benefit_key', 'retirement');
  if (benError) {
    console.error("Benefits fetch error:", benError);
    return;
  }
  
  const bensMap = bens.reduce((acc, b) => {
    acc[b.employee_id] = b;
    return acc;
  }, {});
  
  console.log(`\nActive employees in database: ${emps.length}`);
  
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const may31 = new Date(Date.UTC(currentYear, 4, 31));
  
  emps.forEach(emp => {
    const age = emp.birthdate ? computeAge(emp.birthdate, may31) : 0;
    const yis = emp.date_hired ? computeYearsInService(emp.date_hired, may31) : 0;
    const dbBen = bensMap[emp.id];
    
    // Check if they fit the profile: age >= 57 and yis >= 25 (or around that)
    if (age >= 50 || yis >= 20) {
      console.log(`\nName: ${emp.first_name} ${emp.last_name}`);
      console.log(`Birthdate: ${emp.birthdate} (Age before May 31: ${age})`);
      console.log(`Date Hired: ${emp.date_hired} (YIS before May 31: ${yis})`);
      console.log(`Is Eligible (in DB): ${dbBen ? dbBen.is_eligible : 'NO RECORD'}`);
      if (dbBen) {
        console.log(`Award Level: ${dbBen.award_level}`);
        console.log(`Computed At: ${dbBen.computed_at}`);
      }
      
      // Compute with current local rules
      const computed = computeBenefitsEligibility(emp, today);
      console.log(`Computed Eligibility locally:`, computed.retirement);
      console.log("--------------------------------");
    }
  });
}

check();
