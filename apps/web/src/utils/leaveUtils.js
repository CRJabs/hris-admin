import { supabase } from "@/lib/supabase";

export const DEFAULT_LEAVE_CREDITS = {
  Teaching: [
    { leave_type: "Vacation", total_credits: 7, is_commutable: true },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: false },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ],
  "Non-Teaching": [
    { leave_type: "Vacation", total_credits: 10, is_commutable: true },
    { leave_type: "Vacation", total_credits: 5, is_commutable: false },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: false },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ]
};

/**
 * Assigns default leave credits to an employee based on their classification.
 * @param {string} employeeId - The UUID of the employee record.
 * @param {string} classification - "Teaching" or "Non-Teaching".
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function assignDefaultLeaveCredits(employeeId, classification) {
  const credits = DEFAULT_LEAVE_CREDITS[classification] || DEFAULT_LEAVE_CREDITS["Non-Teaching"];
  
  const insertData = credits.map(c => ({
    employee_id: employeeId,
    leave_type: c.leave_type,
    total_credits: c.total_credits,
    used_credits: 0,
    is_commutable: c.is_commutable,
    updated_at: new Date().toISOString()
  }));

  try {
    // First, check if credits already exist to avoid duplicates
    const { data: existing } = await supabase
      .from('leave_credits')
      .select('id')
      .eq('employee_id', employeeId);
    
    if (existing && existing.length > 0) {
      return { success: true, message: "Credits already assigned" };
    }

    const { error } = await supabase
      .from('leave_credits')
      .insert(insertData);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error assigning default leave credits:", error);
    return { success: false, error };
  }
}
