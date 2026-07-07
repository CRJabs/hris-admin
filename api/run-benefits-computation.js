import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// ─── Date Helpers ────────────────────────────────────────────────────────────

/**
 * Computes whole calendar years between two dates.
 * Uses an inclusive +1 day adjustment on refDate so that an employee
 * hired on June 1, 2023 evaluates as exactly 3 years on May 31, 2026.
 */
function computeYearsInService(startDate, referenceDate, semesters = [], classification = "") {
  if (!startDate) return 0;
  const start = new Date(startDate);
  // Add 1 day to make the range inclusive (e.g. "before May 31" includes May 31 itself)
  const ref = new Date(new Date(referenceDate).getTime() + 86400000);
  if (isNaN(start.getTime())) return 0;

  let years = ref.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - start.getUTCMonth();
  const dayDiff = ref.getUTCDate() - start.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years--;
  let yearsInService = Math.max(0, years);

  // For Teaching employees, subtract academic years with no teaching load
  if (classification && classification.toLowerCase() === "teaching") {
    const getAcademicYearStart = (date) => {
      const d = new Date(date);
      const m = d.getUTCMonth();
      const y = d.getUTCFullYear();
      return m >= 5 ? y : y - 1;
    };

    const startAY = getAcademicYearStart(start);
    const refAY = getAcademicYearStart(ref);
    let missingLoadsCount = 0;

    for (let yr = startAY; yr < refAY; yr++) {
      const ayString = `${yr}-${yr + 1}`;
      const hasLoad = semesters.some(
        (s) =>
          s.academic_year === ayString &&
          s.teaching_load !== null &&
          s.teaching_load !== undefined &&
          parseFloat(s.teaching_load) > 0
      );
      if (!hasLoad) missingLoadsCount++;
    }

    yearsInService = Math.max(0, yearsInService - missingLoadsCount);
  }

  return yearsInService;
}

/** Computes whole calendar years of age (strict — no +1 day adjustment). */
function computeAge(birthdate, referenceDate) {
  if (!birthdate) return 0;
  const start = new Date(birthdate);
  const ref = new Date(referenceDate);
  if (isNaN(start.getTime())) return 0;
  let years = ref.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - start.getUTCMonth();
  const dayDiff = ref.getUTCDate() - start.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years--;
  return Math.max(0, years);
}

/** Computes whole months of service (inclusive +1 day). */
function computeMonthsInService(startDate, referenceDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const ref = new Date(new Date(referenceDate).getTime() + 86400000);
  if (isNaN(start.getTime())) return 0;
  let months =
    (ref.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (ref.getUTCMonth() - start.getUTCMonth());
  if (ref.getUTCDate() < start.getUTCDate()) months--;
  return Math.max(0, months);
}

/** Returns true if today is in the Midyear Bonus pre-notification window (May 30 – June 30). */
function isMidyearReminderDue(referenceDate) {
  const ref = new Date(referenceDate);
  const y = ref.getUTCFullYear();
  const may30 = new Date(Date.UTC(y, 4, 30));
  const june30 = new Date(Date.UTC(y, 5, 30));
  return ref >= may30 && ref <= june30;
}

// ─── Eligibility Engine ──────────────────────────────────────────────────────

function computeBenefitsEligibility(employee, referenceDate, tenureStartDate, semesters) {
  const ref = new Date(referenceDate);
  const y = ref.getUTCFullYear();

  const tenure = employee.employment_tenure || "";
  const isActive = employee.is_active !== false;

  const may31 = new Date(Date.UTC(y, 4, 31));
  const july31 = new Date(Date.UTC(y, 6, 31));
  const dec31 = new Date(Date.UTC(y, 11, 31));

  const results = {};

  // 1. Rice, Clothing & Laundry
  const ALLOWANCE_TENURES = ["Regular", "Probationary", "Part-Time"];
  const isRiceEligible = isActive && ALLOWANCE_TENURES.includes(tenure);
  results.rice_clothing_laundry = {
    isEligible: isRiceEligible,
    awardLevel: null,
    reason: isRiceEligible
      ? `Eligible under ${tenure} employment tenure.`
      : `Tenure "${tenure || "Unknown"}" does not qualify. Requires Regular, Probationary, or Part-Time.`,
  };

  // 2. Birthday Bonus — must have ≥1 year of service AND birthday must have already occurred this year
  const yearsInService = computeYearsInService(
    employee.date_hired,
    ref,
    semesters,
    employee.employment_classification
  );
  const hasBirthdate = !!employee.birthdate;
  let birthdayThisYear = null;
  let birthdayHasOccurred = false;
  if (hasBirthdate) {
    const bd = new Date(employee.birthdate);
    birthdayThisYear = new Date(Date.UTC(y, bd.getUTCMonth(), bd.getUTCDate()));
    birthdayHasOccurred = ref >= birthdayThisYear;
  }
  const yearsOnBirthday = hasBirthdate
    ? computeYearsInService(employee.date_hired, birthdayThisYear, semesters, employee.employment_classification)
    : 0;
  const isBirthdayEligible = isActive && hasBirthdate && birthdayHasOccurred && yearsOnBirthday >= 1;
  results.birthday_bonus = {
    isEligible: isBirthdayEligible,
    awardLevel: null,
    reason: !hasBirthdate
      ? "Requires a valid birthdate."
      : !birthdayHasOccurred
      ? `Birthday (${birthdayThisYear?.toISOString().split("T")[0]}) has not yet occurred this year.`
      : isBirthdayEligible
      ? `${yearsOnBirthday} year(s) of service on birthday. Eligible.`
      : `Requires at least 1 completed year of service on birthday. Current: ${yearsOnBirthday} year(s).`,
  };

  // 3. Summer Pay — qualifying tenure ≥3 years before May 31 (continuous tenure block)
  const isSummerTenure = ["Regular", "Probationary", "Part-Time"].includes(tenure);
  const tenureStart = tenureStartDate
    ? new Date(tenureStartDate)
    : employee.date_hired
    ? new Date(employee.date_hired)
    : null;
  const yearsSummerTenure = tenureStart
    ? computeYearsInService(tenureStart, may31, semesters, employee.employment_classification)
    : 0;
  const isSummerEligible = isActive && isSummerTenure && yearsSummerTenure >= 3;
  results.summer_pay = {
    isEligible: isSummerEligible,
    awardLevel: null,
    reason: isSummerEligible
      ? `${yearsSummerTenure} year(s) of qualifying service before May 31. Eligible.`
      : !isSummerTenure
      ? `Tenure "${tenure || "Unknown"}" does not qualify. Requires Regular, Probationary, or Part-Time.`
      : `Requires at least 3 years of qualifying service before May 31. Current: ${yearsSummerTenure} year(s).`,
  };

  // 4. 13th Month Pay — ≥1 complete month of service before Dec 31
  const monthsToDecEnd = computeMonthsInService(employee.date_hired, dec31);
  const is13thEligible = isActive && monthsToDecEnd >= 1;
  results.thirteenth_month = {
    isEligible: is13thEligible,
    awardLevel: null,
    reason: is13thEligible
      ? `${monthsToDecEnd} month(s) of service this year. Eligible.`
      : "Requires at least 1 month of service before December 31.",
  };

  // 5. Midyear Bonus — eligible for 13th Month AND Regular tenure
  const isMidyearEligible = is13thEligible && tenure === "Regular";
  results.midyear_bonus = {
    isEligible: isMidyearEligible,
    awardLevel: null,
    reason: isMidyearEligible
      ? "Regular tenure with at least 1 month of service. Bonus disbursed every June 30."
      : tenure !== "Regular"
      ? `Requires Regular employment tenure. Current: "${tenure || "Unknown"}".`
      : "Requires at least 1 month of service this year.",
  };

  // 6. Service Awardee — milestone reached TODAY (not just projected to July 31)
  const yearsToday = computeYearsInService(
    employee.date_hired,
    ref,
    semesters,
    employee.employment_classification
  );
  const yearsBeforeJuly31 = computeYearsInService(
    employee.date_hired,
    july31,
    semesters,
    employee.employment_classification
  );
  const SERVICE_MILESTONES = [25, 15, 10];
  // Only eligible if: milestone will be reached before July 31 AND employee has already reached it today
  const reachedMilestone = SERVICE_MILESTONES.find(
    (m) => yearsBeforeJuly31 >= m && yearsToday >= m
  );
  const isServiceEligible = isActive && !!reachedMilestone;
  results.service_award = {
    isEligible: isServiceEligible,
    awardLevel: reachedMilestone ? `${reachedMilestone}-year` : null,
    reason: isServiceEligible
      ? `Reached ${reachedMilestone}-year service milestone.`
      : `No service milestone (10, 15, or 25 years) reached yet. Current: ${yearsToday} year(s).`,
  };

  // 7. Retirement — age ≥57 AND ≥25 years TODAY, both conditions before May 31
  const ageBeforeMay31 = computeAge(employee.birthdate, may31);
  const yearsBeforeMay31 = computeYearsInService(
    employee.date_hired,
    may31,
    semesters,
    employee.employment_classification
  );
  const ageToday = computeAge(employee.birthdate, ref);
  const isRetirementEligible =
    isActive && ageBeforeMay31 >= 57 && yearsBeforeMay31 >= 25 && ageToday >= 57 && yearsInService >= 25;
  results.retirement = {
    isEligible: isRetirementEligible,
    awardLevel: isRetirementEligible ? "retired" : null,
    reason: isRetirementEligible
      ? `Age ${ageToday} with ${yearsInService} year(s) of service. Eligible for retirement.`
      : ageToday < 57
      ? `Requires age 57. Current age: ${ageToday}.`
      : `Requires 25 years of service. Current: ${yearsInService} year(s).`,
  };

  return results;
}

// ─── Notification Helpers ────────────────────────────────────────────────────

function getBenefitTitle(key) {
  const titles = {
    rice_clothing_laundry: "Allowances Eligibility",
    birthday_bonus: "Birthday Bonus",
    summer_pay: "Summer Pay",
    thirteenth_month: "13th Month Pay",
    midyear_bonus: "Midyear Bonus",
    service_award: "Service Award",
    retirement: "Retirement Eligibility",
  };
  return titles[key] || "Benefit Update";
}

function getEmployeeMessage(key, awardLevel) {
  const messages = {
    rice_clothing_laundry: "You are now eligible for Rice, Clothing, and Laundry Allowance.",
    birthday_bonus: "You are now eligible for the Birthday Bonus.",
    summer_pay: "You are now eligible for Summer Pay.",
    thirteenth_month: "You are eligible for 13th Month Pay this year.",
    midyear_bonus: "You are eligible for the Midyear Bonus (disbursed June 30).",
    service_award: `Congratulations! You qualify for the ${awardLevel || ""} Service Award.`,
    retirement: "You are now eligible for retirement benefits.",
  };
  return messages[key] || "You have new benefit eligibility updates.";
}

function getAdminMessage(key, empName, awardLevel) {
  const messages = {
    rice_clothing_laundry: `${empName} is now eligible for allowances.`,
    birthday_bonus: `${empName} is eligible for Birthday Bonus.`,
    summer_pay: `${empName} qualifies for Summer Pay.`,
    thirteenth_month: `${empName} is eligible for 13th Month Pay.`,
    midyear_bonus: `${empName} qualifies for the Midyear Bonus.`,
    service_award: `${empName} has reached the ${awardLevel || ""} Service Award milestone.`,
    retirement: `${empName} is now eligible for retirement.`,
  };
  return messages[key] || `${empName} has new benefit eligibility updates.`;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow GET (from cron) or POST (from manual admin trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase server environment variables" });
  }

  // 1. Authenticate Request
  if (req.method === "POST") {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = authHeader.slice("Bearer ".length);
    if (token === "debug-token" && process.env.NODE_ENV !== "production") {
      // Bypass auth validation in dev environment for automated scripts
      console.log("Bypassing auth validation using development debug token");
    } else {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      if (userError || !userData?.user?.id) {
        return res.status(401).json({ error: "Unauthorized user token" });
      }
    }
  } else if (req.method === "GET") {
    const vercelCronHeader = req.headers["x-vercel-cron"];
    if (vercelCronHeader !== "1" && process.env.NODE_ENV === "production") {
      return res.status(401).json({ error: "Unauthorized cron execution" });
    }
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("Starting daily benefits computation...");

  try {
    // 1. Fetch all active employees
    const { data: employees, error: empError } = await adminClient
      .from("employees")
      .select("*")
      .eq("is_active", true);

    if (empError) throw empError;
    if (!employees || employees.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 2. Fetch tenure history for all active employees
    const { data: historyData, error: histError } = await adminClient
      .from("employee_tenure_history")
      .select("employee_id, employment_tenure, effective_date")
      .in("employee_id", employees.map((e) => e.id));

    if (histError) throw histError;

    const historyByEmployee = (historyData || []).reduce((acc, row) => {
      if (!acc[row.employee_id]) acc[row.employee_id] = [];
      acc[row.employee_id].push(row);
      return acc;
    }, {});

    // 3. Fetch all semester records for teaching load calculations
    const { data: semesterData } = await adminClient
      .from("employee_semesters")
      .select("employee_id, academic_year, semester, teaching_load")
      .in("employee_id", employees.map((e) => e.id));

    const semestersByEmployee = (semesterData || []).reduce((acc, row) => {
      if (!acc[row.employee_id]) acc[row.employee_id] = [];
      acc[row.employee_id].push(row);
      return acc;
    }, {});

    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const isMidyearDue = isMidyearReminderDue(today);

    const QUALIFYING_TENURES = ["Regular", "Probationary", "Part-Time"];
    const notificationsToInsert = [];
    const adminActivitiesToInsert = [];

    // 4. Process each employee
    for (const emp of employees) {
      // Resolve the earliest start date of the continuous qualifying tenure block
      // This correctly counts Probationary → Regular transitions as unbroken service for Summer Pay.
      let tenureStartDate = emp.date_hired;
      const history = (historyByEmployee[emp.id] || []).sort(
        (a, b) => new Date(a.effective_date) - new Date(b.effective_date)
      );

      if (history.length > 0 && QUALIFYING_TENURES.includes(emp.employment_tenure)) {
        let blockStart = null;
        for (let i = history.length - 1; i >= 0; i--) {
          if (QUALIFYING_TENURES.includes(history[i].employment_tenure)) {
            blockStart = history[i].effective_date;
          } else {
            break; // hit a non-qualifying period; stop
          }
        }
        
        if (blockStart) {
          const hasBreakBeforeBlock = history.some(h => 
            new Date(h.effective_date) < new Date(blockStart) && 
            !QUALIFYING_TENURES.includes(h.employment_tenure)
          );
          
          if (emp.date_hired && new Date(emp.date_hired) < new Date(blockStart) && !hasBreakBeforeBlock) {
            tenureStartDate = emp.date_hired;
          } else {
            tenureStartDate = blockStart;
          }
        }
      }

      // 5. Compute eligibility
      const eligibility = computeBenefitsEligibility(
        emp,
        today,
        tenureStartDate,
        semestersByEmployee[emp.id] || []
      );

      // 6. Fetch existing records for this year
      const { data: existingRecords } = await adminClient
        .from("employee_benefits")
        .select("*")
        .eq("employee_id", emp.id)
        .eq("eligibility_year", currentYear);

      const existingMap = (existingRecords || []).reduce((acc, r) => {
        acc[r.benefit_key] = r;
        return acc;
      }, {});

      // 7. Upsert results and queue notifications
      for (const [key, result] of Object.entries(eligibility)) {
        const existing = existingMap[key];

        const record = {
          employee_id: emp.id,
          benefit_key: key,
          eligibility_year: currentYear,
          is_eligible: result.isEligible,
          award_level: result.awardLevel,
          computed_at: new Date().toISOString(),
          notified_employee: existing ? existing.notified_employee : false,
          notified_admin: existing ? existing.notified_admin : false,
          midyear_reminded: existing ? existing.midyear_reminded : false,
        };

        // Trigger notifications only when newly eligible or milestone level changes
        if (
          result.isEligible &&
          (!existing || !existing.is_eligible ||
            (key === "service_award" && existing.award_level !== result.awardLevel))
        ) {
          if (!record.notified_employee) {
            notificationsToInsert.push({
              employee_id: emp.id,
              type: "info",
              title: getBenefitTitle(key),
              message: getEmployeeMessage(key, result.awardLevel),
            });
            record.notified_employee = true;
          }

          if (!record.notified_admin) {
            adminActivitiesToInsert.push({
              actor_type: "system",
              actor_name: "Benefits Updates",
              action: "benefit_eligible_employee",
              description: getAdminMessage(key, `${emp.first_name} ${emp.last_name}`, result.awardLevel),
              employee_id: emp.id,
            });
            record.notified_admin = true;
          }
        }

        // Midyear Bonus pre-notification
        if (key === "midyear_bonus" && result.isEligible && isMidyearDue && !record.midyear_reminded) {
          notificationsToInsert.push({
            employee_id: emp.id,
            type: "info",
            title: "Midyear Bonus Reminder",
            message: "Reminder: Your Midyear Bonus will be disbursed on June 30.",
          });
          record.midyear_reminded = true;
        }

        const { error: upsertError } = await adminClient
          .from("employee_benefits")
          .upsert(record, { onConflict: "employee_id, benefit_key, eligibility_year" });

        if (upsertError) {
          console.error(`Error upserting benefit ${key} for emp ${emp.id}:`, upsertError);
        }
      }
    }

    // 8. Bulk insert notifications
    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await adminClient.from("notifications").insert(notificationsToInsert);
      if (notifError) console.error("Error inserting employee notifications:", notifError);
    }

    if (adminActivitiesToInsert.length > 0) {
      const { error: adminNotifError } = await adminClient
        .from("admin_activity_log")
        .insert(adminActivitiesToInsert);
      if (adminNotifError) console.error("Error inserting admin notifications:", adminNotifError);
    }

    console.log(`Benefits computation complete. Processed ${employees.length} employees.`);
    return res.status(200).json({ success: true, count: employees.length });
  } catch (err) {
    console.error("Critical error in benefits computation:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
