import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // 1. Find the most recent fully approved commutation request
  const { data: approved, error: err1 } = await supabase
    .from('commutation_requests')
    .select('id, employee_id, total_days, status, final_approved')
    .eq('status', 'approved')
    .order('final_approved_at', { ascending: false })
    .limit(3);

  console.log('=== APPROVED COMMUTATION REQUESTS ===');
  if (err1) { console.error(err1); return; }
  console.log(approved);

  if (!approved || approved.length === 0) {
    console.log('No fully approved requests found.');

    // Check all requests to see current states
    const { data: all } = await supabase
      .from('commutation_requests')
      .select('id, employee_id, total_days, status, ra_approved, noted_approved, final_approved')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('\n=== ALL RECENT REQUESTS ===');
    console.log(all);
    return;
  }

  // 2. Check commutable leave_credits for that employee
  const req = approved[0];
  console.log(`\nChecking leave_credits for employee_id: ${req.employee_id}`);
  const { data: credits, error: err2 } = await supabase
    .from('leave_credits')
    .select('id, leave_type, is_commutable, total_credits, used_credits')
    .eq('employee_id', req.employee_id)
    .eq('is_commutable', true);

  console.log('\n=== COMMUTABLE LEAVE CREDITS ===');
  if (err2) { console.error(err2); return; }
  console.log(credits);

  // 3. Test a small deduction update using service role
  if (credits && credits.length > 0) {
    console.log('\n=== TESTING UPDATE (adding 0.001 to used_credits, service role) ===');
    const testCredit = credits[0];
    const { data: updated, error: updateErr } = await supabase
      .from('leave_credits')
      .update({ used_credits: parseFloat(testCredit.used_credits || 0) + 0.001 })
      .eq('id', testCredit.id)
      .select();
    if (updateErr) {
      console.error('UPDATE FAILED:', updateErr);
    } else {
      console.log('Update succeeded:', updated);
      // Revert
      await supabase.from('leave_credits')
        .update({ used_credits: parseFloat(testCredit.used_credits || 0) })
        .eq('id', testCredit.id);
      console.log('Reverted successfully.');
    }
  }
}

check();
