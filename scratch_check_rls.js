import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Test with anon key (what the browser uses)
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  // Try to update leave_credits using anon key (simulating browser client behavior)
  const { data: credits } = await supabase
    .from('leave_credits')
    .select('id, employee_id, leave_type, used_credits')
    .eq('employee_id', '7a4f8e51-8cc9-458d-89b4-a88421672301')
    .eq('is_commutable', true)
    .limit(1);

  console.log('Credits fetched with anon key:', credits);

  if (credits && credits.length > 0) {
    const { data: updated, error } = await supabase
      .from('leave_credits')
      .update({ used_credits: parseFloat(credits[0].used_credits || 0) + 0.001 })
      .eq('id', credits[0].id)
      .select();

    if (error) {
      console.log('UPDATE WITH ANON KEY FAILED (RLS blocking):', error.message, error.code);
    } else {
      console.log('Update with anon key succeeded:', updated);
      // Revert
      await supabase.from('leave_credits')
        .update({ used_credits: parseFloat(credits[0].used_credits || 0) })
        .eq('id', credits[0].id);
    }
  }
}

check();
