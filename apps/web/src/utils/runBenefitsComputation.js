import { supabase } from '@/lib/supabase';
import { computeBenefitsEligibility, isMidyearReminderDue } from './benefitsEngine';

/**
 * Main batch computation service for employee benefits.
 * Should be run once per day (triggered by admin login).
 */
export async function runBenefitsComputation() {
  console.log("Starting daily benefits computation...");

  try {
    // 1. Fetch all active employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);

    if (empError) throw empError;
    if (!employees || employees.length === 0) return { success: true, count: 0 };

    // 2. Fetch tenure history for all active employees to resolve tenureStartDate
    const { data: historyData, error: histError } = await supabase
      .from('employee_tenure_history')
      .select('employee_id, employment_tenure, effective_date')
      .in('employee_id', employees.map(e => e.id));

    if (histError) throw histError;

    const historyByEmployee = (historyData || []).reduce((acc, row) => {
      if (!acc[row.employee_id]) acc[row.employee_id] = [];
      acc[row.employee_id].push(row);
      return acc;
    }, {});

    const today = new Date();
    const currentYear = today.getFullYear();
    const isMidyearDue = isMidyearReminderDue(today);

    let notificationsToInsert = [];
    let adminActivitiesToInsert = [];

    // Process each employee
    for (const emp of employees) {
      // Find tenure start date for Summer Pay (Probationary or Part-Time)
      const targetTenure = emp.employment_tenure;
      let tenureStartDate = null;
      if (historyByEmployee[emp.id]) {
        const matchingHistory = historyByEmployee[emp.id]
          .filter(h => h.employment_tenure === targetTenure)
          .sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
        if (matchingHistory.length > 0) {
          tenureStartDate = matchingHistory[0].effective_date;
        }
      }

      // 3. Compute eligibility
      const eligibility = computeBenefitsEligibility(emp, today, tenureStartDate);

      // 4. Fetch existing records for this year
      const { data: existingRecords } = await supabase
        .from('employee_benefits')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('eligibility_year', currentYear);

      const existingMap = (existingRecords || []).reduce((acc, r) => {
        acc[r.benefit_key] = r;
        return acc;
      }, {});

      // 5. Upsert new results and prepare notifications
      for (const [key, result] of Object.entries(eligibility)) {
        const existing = existingMap[key];

        // Prepare record for upsert
        const record = {
          employee_id: emp.id,
          benefit_key: key,
          eligibility_year: currentYear,
          is_eligible: result.isEligible,
          award_level: result.awardLevel,
          computed_at: new Date().toISOString(),
          // Preserve notification flags if record exists
          notified_employee: existing ? existing.notified_employee : false,
          notified_admin: existing ? existing.notified_admin : false,
          midyear_reminded: existing ? existing.midyear_reminded : false,
        };

        // If newly eligible (or award level changed for service award), send notifications
        if (result.isEligible && (!existing || !existing.is_eligible || (key === 'service_award' && existing.award_level !== result.awardLevel))) {
          // Send employee notification if not already sent for this event
          if (!record.notified_employee) {
            notificationsToInsert.push({
              employee_id: emp.id,
              type: 'info',
              title: getBenefitTitle(key),
              message: getEmployeeMessage(key, result.awardLevel)
            });
            record.notified_employee = true;
          }

          // Send admin notification if not already sent
          if (!record.notified_admin) {
            adminActivitiesToInsert.push({
              actor_type: 'system',
              actor_name: 'Benefits Updates',
              action: 'benefit_eligible_employee',
              description: getAdminMessage(key, `${emp.first_name} ${emp.last_name}`, result.awardLevel),
              employee_id: emp.id
            });
            record.notified_admin = true;
          }
        }

        // Midyear Bonus Pre-notification logic
        if (key === 'midyear_bonus' && result.isEligible && isMidyearDue && !record.midyear_reminded) {
           notificationsToInsert.push({
             employee_id: emp.id,
             type: 'info',
             title: 'Midyear Bonus Reminder',
             message: 'Reminder: Your Midyear Bonus will be disbursed on June 30.'
           });
           record.midyear_reminded = true;
        }

        // Execute Upsert for this benefit (Supabase requires conflict resolution on constraint)
        const { error: upsertError } = await supabase
          .from('employee_benefits')
          .upsert(record, { onConflict: 'employee_id, benefit_key, eligibility_year' });
          
        if (upsertError) {
           console.error(`Error upserting benefit ${key} for emp ${emp.id}:`, upsertError);
        }
      }
    }

    // 6. Bulk insert notifications
    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await supabase.from('notifications').insert(notificationsToInsert);
      if (notifError) console.error("Error inserting employee notifications:", notifError);
    }

    if (adminActivitiesToInsert.length > 0) {
      const { error: adminNotifError } = await supabase.from('admin_activity_log').insert(adminActivitiesToInsert);
      if (adminNotifError) console.error("Error inserting admin notifications:", adminNotifError);
    }

    console.log(`Benefits computation complete. Processed ${employees.length} employees.`);
    return { success: true, count: employees.length };

  } catch (err) {
    console.error("Critical error in runBenefitsComputation:", err);
    return { success: false, error: err.message };
  }
}

// Helpers for notification templates
function getBenefitTitle(key) {
  const titles = {
    rice_clothing_laundry: 'Allowances Eligibility',
    birthday_bonus: 'Birthday Bonus',
    summer_pay: 'Summer Pay',
    thirteenth_month: '13th Month Pay',
    midyear_bonus: 'Midyear Bonus',
    service_award: 'Service Award',
    retirement: 'Retirement Eligibility'
  };
  return titles[key] || 'Benefit Update';
}

function getEmployeeMessage(key, awardLevel) {
  const messages = {
    rice_clothing_laundry: 'You are now eligible for Rice, Clothing, and Laundry Allowance.',
    birthday_bonus: 'You are now eligible for the Birthday Bonus.',
    summer_pay: 'You are now eligible for Summer Pay.',
    thirteenth_month: 'You are eligible for 13th Month Pay this year.',
    midyear_bonus: 'You are eligible for the Midyear Bonus (disbursed June 30).',
    service_award: `Congratulations! You qualify for the ${awardLevel || ''} Service Award.`,
    retirement: 'You are now eligible for retirement benefits.'
  };
  return messages[key] || 'You have new benefit eligibility updates.';
}

function getAdminMessage(key, empName, awardLevel) {
  const messages = {
    rice_clothing_laundry: `${empName} is now eligible for allowances.`,
    birthday_bonus: `${empName} is eligible for Birthday Bonus.`,
    summer_pay: `${empName} qualifies for Summer Pay.`,
    thirteenth_month: `${empName} is eligible for 13th Month Pay.`,
    midyear_bonus: `${empName} qualifies for Midyear Bonus.`,
    service_award: `${empName} has reached the ${awardLevel || ''} milestone.`,
    retirement: `${empName} meets retirement eligibility criteria.`
  };
  return messages[key] || `${empName} has a new benefit eligibility.`;
}
