import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'commutation_requests' });
  
  if (error) {
    // If RPC is not available, select one row to inspect keys
    const { data: rows } = await supabase.from('commutation_requests').select('*').limit(1);
    console.log("Commutation requests columns (via row):", rows && rows[0] ? Object.keys(rows[0]) : "No rows");
    if (rows && rows[0]) {
      console.log("Row details:", rows[0]);
    }
  } else {
    console.log("Commutation requests columns:", cols);
  }
}

check();
