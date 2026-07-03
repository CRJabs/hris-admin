import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("commutation_requests")
    .select(`
      *,
      employees:employees!commutation_requests_employee_id_fkey (
        id,
        first_name,
        last_name,
        employee_id,
        department,
        position,
        photo_url,
        signature_url
      )
    `);
  
  if (error) {
    console.error("Supabase Query Error:", error);
  } else {
    console.log("Successfully fetched commutation requests! Count:", data.length);
    if (data[0]) {
      console.log("Sample request record:", data[0]);
    }
  }
}

check();
