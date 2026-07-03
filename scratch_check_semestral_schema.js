import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: records, error } = await supabase
    .from("employee_semesters")
    .select("*")
    .limit(5);
  
  if (error) {
    console.error("Error querying employee_semesters:", error);
    return;
  }
  
  console.log("=== EMPLOYEE SEMESTERS ===");
  if (records.length === 0) {
    console.log("No records found in employee_semesters.");
  } else {
    console.log("Columns:", Object.keys(records[0]));
    console.log("Sample records:", records);
  }
}

check();
