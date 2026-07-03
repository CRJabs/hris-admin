import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: units, error } = await supabase
    .from("org_units")
    .select("*");
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("=== ORG UNITS ===");
  units.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Parent ID: ${u.parent_id} | Head ID: ${u.head_id}`);
  });
}

check();
