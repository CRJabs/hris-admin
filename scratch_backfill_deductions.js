import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deductForRequest(req) {
  console.log(`\nProcessing request id=${req.id}, employee=${req.employee_id}, total_days=${req.total_days}`);
  let daysToDeduct = parseFloat(req.total_days || 0);
  if (daysToDeduct <= 0) {
    console.log('  Skipping — no days to deduct.');
    return;
  }

  const { data: credits, error } = await supabase
    .from('leave_credits')
    .select('id, leave_type, total_credits, used_credits')
    .eq('employee_id', req.employee_id)
    .eq('is_commutable', true)
    .order('leave_type'); // will re-sort below

  if (error || !credits) {
    console.error('  Failed to fetch credits:', error);
    return;
  }

  // Sort: Sick first, Vacation second, then rest
  const sorted = [...credits].sort((a, b) => {
    const order = { Sick: 1, Vacation: 2 };
    return (order[a.leave_type] || 3) - (order[b.leave_type] || 3);
  });

  for (const credit of sorted) {
    if (daysToDeduct <= 0) break;
    const available = parseFloat(credit.total_credits || 0) - parseFloat(credit.used_credits || 0);
    if (available <= 0) continue;

    const deduct = Math.min(daysToDeduct, available);
    const { error: updateErr } = await supabase
      .from('leave_credits')
      .update({ used_credits: parseFloat(credit.used_credits || 0) + deduct })
      .eq('id', credit.id);

    if (updateErr) {
      console.error(`  Failed to update ${credit.leave_type} credit:`, updateErr);
    } else {
      console.log(`  Deducted ${deduct} days from ${credit.leave_type} Leave (was ${credit.used_credits}, now ${parseFloat(credit.used_credits || 0) + deduct})`);
      daysToDeduct -= deduct;
    }
  }

  if (daysToDeduct > 0) {
    console.log(`  WARNING: Still ${daysToDeduct} days remaining to deduct — insufficient credits.`);
  } else {
    console.log(`  ✓ Fully deducted.`);
  }
}

async function backfill() {
  console.log('=== BACKFILL: Deducting credits for already-approved commutation requests ===\n');

  const { data: approved, error } = await supabase
    .from('commutation_requests')
    .select('id, employee_id, total_days, status')
    .eq('status', 'approved')
    .eq('final_approved', true);

  if (error) { console.error('Failed to fetch approved requests:', error); return; }
  console.log(`Found ${approved.length} fully approved request(s) to backfill.`);

  for (const req of approved) {
    await deductForRequest(req);
  }

  console.log('\n=== BACKFILL COMPLETE ===');

  // Print final state
  const { data: finalCredits } = await supabase
    .from('leave_credits')
    .select('employee_id, leave_type, is_commutable, total_credits, used_credits')
    .eq('employee_id', approved[0]?.employee_id)
    .eq('is_commutable', true);
  console.log('\nFinal leave_credits state:', finalCredits);
}

backfill();
