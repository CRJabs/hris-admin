/**
 * Benefits Eligibility Engine
 * Pure computation module — no Supabase calls, no side effects.
 * All functions accept a referenceDate argument for testability.
 */

/**
 * Computes whole years between two dates.
 * @param {Date|string} startDate
 * @param {Date|string} referenceDate
 * @returns {number}
 */
export function computeYearsInService(startDate, referenceDate = new Date(), semesters = [], classification = '') {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const ref = new Date(referenceDate);
  if (isNaN(start.getTime())) return 0;

  let years = ref.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - start.getUTCMonth();
  const dayDiff = ref.getUTCDate() - start.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years--;
  let yearsInService = Math.max(0, years);

  // For Teaching employees, reduce years in service for every completed academic year they did not have inputted teaching loads
  if (classification && classification.toLowerCase() === 'teaching') {
    const getAcademicYearStart = (date) => {
      const d = new Date(date);
      const m = d.getUTCMonth();
      const y = d.getUTCFullYear();
      return m >= 5 ? y : y - 1; // Academic year starts in June (month 5)
    };

    const startAY = getAcademicYearStart(start);
    const refAY = getAcademicYearStart(ref);
    let missingLoadsCount = 0;

    for (let yr = startAY; yr < refAY; yr++) {
      const ayString = `${yr}-${yr + 1}`;
      // Check if there is any semester record for this academic year with a valid teaching load
      const hasLoad = semesters.some(s => 
        s.academic_year === ayString && 
        s.teaching_load !== null && 
        s.teaching_load !== undefined &&
        parseFloat(s.teaching_load) > 0
      );
      if (!hasLoad) {
        missingLoadsCount++;
      }
    }

    yearsInService = Math.max(0, yearsInService - missingLoadsCount);
  }

  return yearsInService;
}

/**
 * Computes whole years of age.
 * @param {Date|string} birthdate
 * @param {Date|string} referenceDate
 * @returns {number}
 */
export function computeAge(birthdate, referenceDate = new Date()) {
  return computeYearsInService(birthdate, referenceDate);
}

/**
 * Computes whole months of service (used for 13th Month Pay).
 * @param {Date|string} startDate
 * @param {Date|string} referenceDate
 * @returns {number}
 */
export function computeMonthsInService(startDate, referenceDate = new Date()) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const ref = new Date(referenceDate);
  if (isNaN(start.getTime())) return 0;

  let months =
    (ref.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (ref.getUTCMonth() - start.getUTCMonth());
  if (ref.getUTCDate() < start.getUTCDate()) months--;
  return Math.max(0, months);
}

/**
 * Returns true if today is on or after May 30 and on or before June 30
 * (the Midyear Bonus pre-notification window).
 * @param {Date} referenceDate
 * @returns {boolean}
 */
export function isMidyearReminderDue(referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const y = ref.getUTCFullYear();
  const may30 = new Date(Date.UTC(y, 4, 30));
  const june30 = new Date(Date.UTC(y, 5, 30));
  return ref >= may30 && ref <= june30;
}

/**
 * Main benefit eligibility calculator.
 *
 * @param {object} employee         - Employee record from DB
 * @param {Date}   [referenceDate]  - Defaults to today (injectable for tests)
 * @param {Date|string|null} [tenureStartDate]
 *   Start of the employee's current Probationary or Part-Time tenure period,
 *   resolved from employee_tenure_history. Falls back to date_hired if null.
 *
 * @returns {Object.<string, {isEligible: boolean, reason: string, awardLevel?: string|null}>}
 */
export function computeBenefitsEligibility(
  employee,
  referenceDate = new Date(),
  tenureStartDate = null,
  semesters = []
) {
  const ref = new Date(referenceDate);
  const y = ref.getUTCFullYear();

  const tenure = employee.employment_tenure || '';
  const isActive = employee.is_active !== false;

  // Key date cutoffs constructed as UTC dates to prevent timezone shifting
  const may31   = new Date(Date.UTC(y, 4, 31));
  const july31  = new Date(Date.UTC(y, 6, 31));
  const dec31   = new Date(Date.UTC(y, 11, 31));

  const results = {};

  // ── 1. Rice, Clothing & Laundry ────────────────────────────────────────────
  const ALLOWANCE_TENURES = ['Regular', 'Probationary', 'Part-Time'];
  const isRiceEligible = isActive && ALLOWANCE_TENURES.includes(tenure);
  results.rice_clothing_laundry = {
    isEligible: isRiceEligible,
    awardLevel: null,
    reason: isRiceEligible
      ? `Eligible under ${tenure} employment tenure.`
      : `Tenure "${tenure || 'Unknown'}" does not qualify. Requires Regular, Probationary, or Part-Time.`,
  };

  // ── 2. Birthday Bonus ──────────────────────────────────────────────────────
  const yearsInService = computeYearsInService(employee.date_hired, ref, semesters, employee.employment_classification);
  const hasBirthdate = !!employee.birthdate;
  const isBirthdayEligible = isActive && yearsInService >= 1 && hasBirthdate;
  results.birthday_bonus = {
    isEligible: isBirthdayEligible,
    awardLevel: null,
    reason: !hasBirthdate
      ? 'Requires a valid birthdate.'
      : isBirthdayEligible
      ? `${yearsInService} year(s) in service. Eligible.`
      : `Requires at least 1 completed year of service. Current: ${yearsInService} year(s).`,
  };

  // ── 3. Summer Pay ──────────────────────────────────────────────────────────
  // Eligible if current tenure is Regular, Probationary, or Part-Time AND
  // total years of service >= 3 computed before May 31.
  const isSummerTenure = ['Regular', 'Probationary', 'Part-Time'].includes(tenure);
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
      ? `${yearsSummerTenure} year(s) of service before May 31. Eligible.`
      : !isSummerTenure
      ? `Tenure "${tenure || 'Unknown'}" does not qualify. Requires Regular, Probationary, or Part-Time.`
      : `Requires at least 3 years of service before May 31. Current: ${yearsSummerTenure} year(s).`,
  };

  // ── 4. 13th Month Pay ──────────────────────────────────────────────────────
  // At least 1 complete month of service before Dec 31 of the current year.
  const monthsToDecEnd = computeMonthsInService(employee.date_hired, dec31);
  const is13thEligible = isActive && monthsToDecEnd >= 1;
  results.thirteenth_month = {
    isEligible: is13thEligible,
    awardLevel: null,
    reason: is13thEligible
      ? `${monthsToDecEnd} month(s) of service this year. Eligible.`
      : 'Requires at least 1 month of service before December 31.',
  };

  // ── 5. Midyear Bonus ───────────────────────────────────────────────────────
  // Must be eligible for 13th Month AND have Regular tenure.
  // Disbursed every June 30; a May 30 pre-notification is also sent.
  const isMidyearEligible = is13thEligible && tenure === 'Regular';
  results.midyear_bonus = {
    isEligible: isMidyearEligible,
    awardLevel: null,
    reason: isMidyearEligible
      ? 'Regular tenure with at least 1 month of service. Bonus disbursed every June 30.'
      : tenure !== 'Regular'
      ? `Requires Regular employment tenure. Current: "${tenure || 'Unknown'}".`
      : 'Requires at least 1 month of service this year.',
  };

  // ── 6. Service Awardee ─────────────────────────────────────────────────────
  // Years in service reaches exactly 10, 15, or 25 before July 31.
  // Fires only in the milestone year (exact match) to prevent re-triggering.
  const yearsBeforeJuly31 = computeYearsInService(employee.date_hired, july31, semesters, employee.employment_classification);
  const SERVICE_MILESTONES = [25, 15, 10];
  const reachedMilestone = SERVICE_MILESTONES.find((m) => yearsBeforeJuly31 === m);
  const isServiceEligible = isActive && !!reachedMilestone;
  results.service_award = {
    isEligible: isServiceEligible,
    awardLevel: reachedMilestone ? `${reachedMilestone}-year` : null,
    reason: isServiceEligible
      ? `Reached ${reachedMilestone}-year service milestone before July 31.`
      : `No service milestone (10, 15, or 25 years) reached before July 31. Current: ${yearsBeforeJuly31} year(s).`,
  };

  // ── 7. Retirement ──────────────────────────────────────────────────────────
  // Age >= 57 AND years_in_service >= 25, both conditions met before May 31.
  const ageBeforeMay31 = computeAge(employee.birthdate, may31);
  const yearsBeforeMay31 = computeYearsInService(employee.date_hired, may31, semesters, employee.employment_classification);
  const isRetirementEligible =
    isActive && ageBeforeMay31 >= 57 && yearsBeforeMay31 >= 25;
  results.retirement = {
    isEligible: isRetirementEligible,
    awardLevel: isRetirementEligible ? 'retired' : null,
    reason: isRetirementEligible
      ? `Age ${ageBeforeMay31} with ${yearsBeforeMay31} year(s) of service before May 31. Eligible for retirement.`
      : ageBeforeMay31 < 57
      ? `Requires age 57 before May 31. Current age: ${ageBeforeMay31}.`
      : `Requires 25 years of service before May 31. Current: ${yearsBeforeMay31} year(s).`,
  };

  return results;
}
