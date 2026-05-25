import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking database records for Cliff Raycee Jabines...");
  
  // 1. Fetch Cliff's employee details
  const { data: emp, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('last_name', 'Jabines')
    .single();
  if (empError) {
    console.error("Employee fetch error:", empError);
    return;
  }
  
  console.log(`\nEmployee: ${emp.first_name} ${emp.last_name}`);
  console.log(`UUID: ${emp.id}`);
  console.log(`Birthdate: ${emp.birthdate}`);
  console.log(`Date Hired: ${emp.date_hired}`);
  console.log(`Is Active: ${emp.is_active}`);
  
  // 2. Fetch Cliff's benefits
  const { data: bens, error: benError } = await supabase
    .from('employee_benefits')
    .select('*')
    .eq('employee_id', emp.id);
  if (benError) {
    console.error("Benefits fetch error:", benError);
    return;
  }
  
  console.log(`\nTotal benefits records in DB for Cliff: ${bens.length}`);
  bens.forEach(b => {
    console.log(`- Key: ${b.benefit_key}`);
    console.log(`  Eligible: ${b.is_eligible}`);
    console.log(`  Year: ${b.eligibility_year}`);
    console.log(`  Award Level: ${b.award_level}`);
    console.log(`  Computed At: ${b.computed_at}`);
  });
}

check();
