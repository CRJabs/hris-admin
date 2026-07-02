import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Fetching one row from leave_applications...");
  const { data, error } = await supabase.from('leave_applications').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Leave Application:", data[0]);
  }

  console.log("Fetching one row from employee_update_requests...");
  const { data: updateData, error: updateError } = await supabase.from('employee_update_requests').select('*').limit(1);
  if (updateError) {
    console.error(updateError);
  } else {
    console.log("Update Request:", updateData[0]);
  }
}

run();
