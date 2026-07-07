import { supabase } from "@/lib/supabase";

// ─── Default Leave Credits ───────────────────────────────────────────────────
// Kept here for reference/display purposes (e.g. AssignLeaveCredits.jsx table).
// The actual insert/reset logic is now handled by api/assign-leave-credits.js.
export const DEFAULT_LEAVE_CREDITS = {
  Teaching: [
    { leave_type: "Vacation", total_credits: 7, is_commutable: true },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ],
  "Non-Teaching": [
    { leave_type: "Vacation", total_credits: 10, is_commutable: true },
    { leave_type: "Vacation", total_credits: 5, is_commutable: false },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ]
};

/**
 * Assigns default leave credits to an employee.
 * Delegates to /api/assign-leave-credits serverless function.
 * @param {string} employeeId
 * @param {string} classification - "Teaching" or "Non-Teaching"
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function assignDefaultLeaveCredits(employeeId, classification) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/assign-leave-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ employeeId, classification }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to assign leave credits');
    }
    return { success: true };
  } catch (error) {
    console.error("Error assigning default leave credits:", error);
    return { success: false, error };
  }
}

// ─── Commutation Approver Resolution ─────────────────────────────────────────

/**
 * Resolves the commutation request approver chain server-side.
 * Calls the Supabase RPC `resolve_commutation_approvers` which traverses the org tree in SQL.
 *
 * @param {string} employeeId - The UUID of the employee record.
 * @returns {Promise<{ ra_id, noted_by_id, approved_by_id, condition_name }>}
 */
export async function resolveCommutationApprovers(employeeId) {
  if (!employeeId) throw new Error("employeeId is required");

  const { data, error } = await supabase.rpc('resolve_commutation_approvers', {
    emp_id: employeeId
  });

  if (error) {
    console.error('Error in resolve_commutation_approvers RPC:', error);
    throw error;
  }

  return data; // returns: { ra_id, noted_by_id, approved_by_id, condition_name }
}
