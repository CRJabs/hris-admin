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
 * Core logic: resolves the 18-condition approver chain using local data.
 * Used synchronously in render contexts (Commutations.jsx, PendingApprovalsModal.jsx)
 * and as a fallback when the Supabase RPC is not yet available.
 *
 * @param {object} employee
 * @param {array} orgUnits
 * @param {array} employees
 * @param {array} semesters
 * @returns {{ ra, notedBy, approvedBy, conditionName }}
 */
export function resolveCommutationApprovers(employee, orgUnits = [], employees = [], semesters = []) {
  if (!employee) return { ra: null, notedBy: null, approvedBy: null, conditionName: "Unknown" };

  // Helper to find parent path
  const findAncestors = (unitId) => {
    const list = [];
    let curr = orgUnits.find(u => u.id === unitId);
    while (curr) {
      list.push(curr);
      if (curr.parent_id) {
        curr = orgUnits.find(u => u.id === curr.parent_id);
      } else {
        break;
      }
    }
    return list;
  };

  let unitId = employee.org_unit_id;
  if (!unitId && employee.department) {
    const matchedUnit = orgUnits.find(u =>
      u.name?.toLowerCase() === employee.department?.toLowerCase() ||
      employee.department?.toLowerCase().includes(u.name?.toLowerCase()) ||
      u.name?.toLowerCase().includes(employee.department?.toLowerCase())
    );
    if (matchedUnit) unitId = matchedUnit.id;
  }

  const ancestors = findAncestors(unitId);

  // Resolve VPs and President units
  const presidentUnit = orgUnits.find(u => !u.parent_id) || orgUnits.find(u => u.name?.toLowerCase().includes('president'));
  const presidentId = presidentUnit?.head_id || presidentUnit?.heads?.[0]?.employee_id;

  const vpAdminUnit = orgUnits.find(u => u.name?.toLowerCase().includes('administration') && u.parent_id === presidentUnit?.id);
  const vpAdminId = vpAdminUnit?.head_id || vpAdminUnit?.heads?.[0]?.employee_id;

  const vpFinanceUnit = orgUnits.find(u => u.name?.toLowerCase().includes('finance') && u.parent_id === presidentUnit?.id);
  const vpFinanceId = vpFinanceUnit?.head_id || vpFinanceUnit?.heads?.[0]?.employee_id;

  const vpAcademicUnit = orgUnits.find(u => u.name?.toLowerCase().includes('academic') && u.parent_id === presidentUnit?.id);
  const vpAcademicId = vpAcademicUnit?.head_id || vpAcademicUnit?.heads?.[0]?.employee_id;

  const presidentEmp = employees.find(e => e.id === presidentId);
  const vpAdminEmp = employees.find(e => e.id === vpAdminId);
  const vpFinanceEmp = employees.find(e => e.id === vpFinanceId);
  const vpAcademicEmp = employees.find(e => e.id === vpAcademicId);

  // Resolve Dean/Office Head (RA)
  let deanEmp = null;
  const execUnitIds = [presidentUnit?.id, vpAdminUnit?.id, vpFinanceUnit?.id, vpAcademicUnit?.id].filter(Boolean);
  for (const unit of ancestors) {
    if (execUnitIds.includes(unit.id)) continue;
    const headId = unit.head_id || unit.heads?.[0]?.employee_id;
    if (headId && headId !== employee.id) {
      const head = employees.find(e => e.id === headId);
      if (head) { deanEmp = head; break; }
    }
  }

  let yearsOfService = 0;
  if (employee.date_hired) {
    const diffMs = Date.now() - new Date(employee.date_hired).getTime();
    yearsOfService = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  }
  const isLessThan3Years = yearsOfService < 3;

  const activeSems = semesters.filter(s => s.employee_id === employee.id && s.is_active === true);
  const hasTeachingLoad = activeSems.some(s => s.teaching_load && parseFloat(s.teaching_load) > 0);

  const isTeaching = employee.employment_classification?.toLowerCase() === "teaching";
  const isManagerial = employee.position?.toLowerCase().includes("manager") ||
                       employee.position?.toLowerCase().includes("supervisor");

  const isUnderVpAdmin = ancestors.some(u => u.id === vpAdminUnit?.id);
  const isDirectUnderPresident = ancestors.length > 0 &&
    ancestors[ancestors.length - 1].id === presidentUnit?.id &&
    !isUnderVpAdmin &&
    !ancestors.some(u => u.id === vpAcademicUnit?.id || u.id === vpFinanceUnit?.id);
  const isUnderAcademicOrNonAcademicGroup = ancestors.some(u =>
    u.id === "1c47e8d6-0b8f-43f7-a590-44c9fd96e7e5" || u.id === "d00f33a5-ffcc-4067-a54c-d9889d599336"
  );

  let ra = null;
  let notedBy = null;
  let approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  let conditionName = "";

  if (employee.id === presidentId || employee.position?.toLowerCase().includes("university president")) {
    conditionName = "University President";
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (employee.id === vpFinanceId || employee.id === vpAcademicId) {
    conditionName = "VP for Finance / VP for Academic Affairs";
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (employee.id === vpAdminId) {
    conditionName = "VP for Administration";
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (isManagerial && isUnderVpAdmin) {
    conditionName = `Managerial/Supervisory under VP for Admin ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  } else if (isManagerial && isDirectUnderPresident) {
    conditionName = `Managerial/Supervisory under University President ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (isManagerial) {
    conditionName = `Managerial/Supervisory under Dean/Office Head ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  } else if (!isTeaching && isDirectUnderPresident && !isUnderAcademicOrNonAcademicGroup && !deanEmp) {
    conditionName = `Non-Teaching under President's Office (${isLessThan3Years ? "Less than" : "More than"} 3 Years)`;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (!isTeaching && isDirectUnderPresident && !isUnderAcademicOrNonAcademicGroup && deanEmp) {
    conditionName = `Non-Teaching under President's Office and Dept Head (${isLessThan3Years ? "Less than" : "More than"} 3 Years) ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  } else if (!isTeaching) {
    conditionName = `Institutional Non-Teaching (${isLessThan3Years ? "Less than" : "More than"} 3 Years) ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  } else {
    conditionName = "Teaching Employee";
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  }

  return { ra, notedBy, approvedBy, conditionName };
}

/**
 * Server-first variant: attempts the Supabase RPC `resolve_commutation_approvers` 
 * for more accurate server-side org-tree traversal.
 * Falls back to `resolveCommutationApprovers` (local) if RPC is unavailable.
 *
 * Use this in async contexts (e.g. form submission in FileRequestModal).
 *
 * @param {object} employee
 * @param {array} orgUnits
 * @param {array} employees
 * @param {array} semesters
 * @returns {Promise<{ ra, notedBy, approvedBy, conditionName }>}
 */
export async function resolveCommutationApproversServer(employee, orgUnits = [], employees = [], semesters = []) {
  if (!employee) return { ra: null, notedBy: null, approvedBy: null, conditionName: "Unknown" };

  try {
    const { data, error } = await supabase.rpc('resolve_commutation_approvers', {
      emp_id: employee.id
    });

    if (!error && data) {
      const ra = data.ra_id ? employees.find(e => e.id === data.ra_id) || null : null;
      const notedBy = data.noted_by_id ? employees.find(e => e.id === data.noted_by_id) || null : null;
      const approvedBy = data.approved_by_id ? employees.find(e => e.id === data.approved_by_id) || null : null;
      return { ra, notedBy, approvedBy, conditionName: data.condition_name || "" };
    }

    // RPC not yet deployed — fall through to local computation
    console.warn('resolve_commutation_approvers RPC not available, using local fallback:', error?.message);
  } catch (rpcErr) {
    console.warn('RPC call failed, using local fallback:', rpcErr);
  }

  return resolveCommutationApprovers(employee, orgUnits, employees, semesters);
}
