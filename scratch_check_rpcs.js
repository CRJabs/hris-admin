import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    // Attempt 1: run query on pg_proc to see if it is exposed
    const { data: procs, error: procError } = await supabase.from('pg_proc').select('proname').limit(5);
    console.log("pg_proc data:", procs, "error:", procError);
    
    // Attempt 2: test if there is an RPC we can use
    const { data: testSql, error: sqlError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    console.log("exec_sql RPC:", testSql, "error:", sqlError);
    
    const { data: testSql2, error: sqlError2 } = await supabase.rpc('execute_sql', { sql: 'SELECT 1' });
    console.log("execute_sql RPC:", testSql2, "error:", sqlError2);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

check();
