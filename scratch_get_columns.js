import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Let's find one employee first
  const { data: emps } = await supabase.from('employees').select('id').limit(1);
  if (!emps || emps.length === 0) {
    console.log("No employees found to run test");
    return;
  }
  const empId = emps[0].id;
  
  // Insert a test row and select all columns
  const { data: inserted, error: insError } = await supabase
    .from('commutation_requests')
    .insert({ employee_id: empId, status: 'pending' })
    .select('*');
    
  if (insError) {
    console.error("Insert error:", insError);
  } else {
    console.log("SUCCESS! Columns in commutation_requests:", Object.keys(inserted[0]));
    console.log("Full inserted row:", inserted[0]);
    
    // Clean up
    const { error: delError } = await supabase
      .from('commutation_requests')
      .delete()
      .eq('id', inserted[0].id);
      
    if (delError) {
      console.error("Delete cleanup error:", delError);
    } else {
      console.log("Cleaned up successfully");
    }
  }
}

check();
