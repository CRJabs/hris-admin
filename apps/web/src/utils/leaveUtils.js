import { supabase } from "@/lib/supabase";

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

/**
 * Dynamically resolves the commutation request approver chain based on the 18 conditions.
 * @param {object} employee - The employee filing the request.
 * @param {array} orgUnits - All organization units.
 * @param {array} employees - All employees list.
 * @param {array} semesters - Semestral records for this employee.
 * @returns {object} { ra, notedBy, approvedBy, conditionName }
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
    if (matchedUnit) {
      unitId = matchedUnit.id;
    }
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

  // Resolve President and VP employees
  const presidentEmp = employees.find(e => e.id === presidentId);
  const vpAdminEmp = employees.find(e => e.id === vpAdminId);
  const vpFinanceEmp = employees.find(e => e.id === vpFinanceId);
  const vpAcademicEmp = employees.find(e => e.id === vpAcademicId);

  // Resolve Dean/Office Head (RA)
  // Direct or ancestor unit head who is a Dean/Head of Office, excluding President & VPs themselves
  let deanEmp = null;
  const execUnitIds = [presidentUnit?.id, vpAdminUnit?.id, vpFinanceUnit?.id, vpAcademicUnit?.id].filter(Boolean);
  for (const unit of ancestors) {
    if (execUnitIds.includes(unit.id)) continue;
    const headId = unit.head_id || unit.heads?.[0]?.employee_id;
    if (headId && headId !== employee.id) {
      const head = employees.find(e => e.id === headId);
      if (head) {
        deanEmp = head;
        break;
      }
    }
  }

  // Calculate Years of Service
  let yearsOfService = 0;
  if (employee.date_hired) {
    const hireDate = new Date(employee.date_hired);
    const diffMs = Date.now() - hireDate.getTime();
    yearsOfService = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  }
  const isLessThan3Years = yearsOfService < 3;

  // Check if has active teaching load in semesters
  const activeSems = semesters.filter(s => s.employee_id === employee.id && s.is_active === true);
  const hasTeachingLoad = activeSems.some(s => s.teaching_load && parseFloat(s.teaching_load) > 0);

  const isTeaching = employee.employment_classification?.toLowerCase() === "teaching";
  const isManagerial = employee.position?.toLowerCase().includes("manager") ||
                       employee.position?.toLowerCase().includes("supervisor");

  // Ancestors checks
  const isUnderVpAdmin = ancestors.some(u => u.id === vpAdminUnit?.id);
  const isDirectUnderPresident = ancestors.length > 0 && ancestors[ancestors.length - 1].id === presidentUnit?.id && !isUnderVpAdmin && !ancestors.some(u => u.id === vpAcademicUnit?.id || u.id === vpFinanceUnit?.id);
  const isUnderAcademicOrNonAcademicGroup = ancestors.some(u => u.id === "1c47e8d6-0b8f-43f7-a590-44c9fd96e7e5" || u.id === "d00f33a5-ffcc-4067-a54c-d9889d599336");

  let ra = null;
  let notedBy = null;
  let approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" }; // default fallback
  let conditionName = "";

  // 1. University President
  if (employee.id === presidentId || employee.position?.toLowerCase().includes("university president")) {
    conditionName = "University President";
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 2. VP for Finance and VP for Academic Affairs
  else if (employee.id === vpFinanceId || employee.id === vpAcademicId) {
    conditionName = "VP for Finance / VP for Academic Affairs";
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 3. VP for Admin
  else if (employee.id === vpAdminId) {
    conditionName = "VP for Administration";
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 4 & 5. Managerial/Supervisory under VP for Admin
  else if (isManagerial && isUnderVpAdmin) {
    conditionName = `Managerial/Supervisory under VP for Admin ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  }
  // 6 & 7. Managerial/Supervisory under University President
  else if (isManagerial && isDirectUnderPresident) {
    conditionName = `Managerial/Supervisory under University President ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 8 & 9. Managerial/Supervisory under DEAN/OFFICE HEAD
  else if (isManagerial) {
    conditionName = `Managerial/Supervisory under Dean/Office Head ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  }
  // 14 & 15. Non-Teaching under President's Office (no department/office head)
  else if (!isTeaching && isDirectUnderPresident && !isUnderAcademicOrNonAcademicGroup && !deanEmp) {
    conditionName = `Non-Teaching under President's Office (${isLessThan3Years ? "Less than" : "More than"} 3 Years)`;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 16 & 17. Non-Teaching under President's Office AND Dept Head
  else if (!isTeaching && isDirectUnderPresident && !isUnderAcademicOrNonAcademicGroup && deanEmp) {
    conditionName = `Non-Teaching under President's Office and Dept Head (${isLessThan3Years ? "Less than" : "More than"} 3 Years) ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    notedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
    approvedBy = presidentEmp || { first_name: "University", last_name: "President" };
  }
  // 10, 11, 12, 13. Institutional Depts/Office Non-Teaching
  else if (!isTeaching) {
    conditionName = `Institutional Non-Teaching (${isLessThan3Years ? "Less than" : "More than"} 3 Years) ${hasTeachingLoad ? "WITH" : "WITHOUT"} Teaching Load`;
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  }
  // 18. All Teaching Employees
  else {
    conditionName = "Teaching Employee";
    ra = deanEmp;
    approvedBy = vpAdminEmp || { first_name: "VP for", last_name: "Administration" };
  }

  return { ra, notedBy, approvedBy, conditionName };
}
