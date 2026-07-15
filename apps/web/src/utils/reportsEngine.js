/**
 * Reports Engine definitions and helpers
 * Pure configuration and formatting helper module.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formats a date string to a readable format, e.g. "May 19"
 */
export function formatBirthDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Formats a date string to "Jan 15, 2020" style.
 */
export function formatDateHired(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Returns full employee name as "Last, First Middle"
 */
export function formatEmployeeName(emp) {
  const parts = [emp.last_name];
  if (emp.first_name) parts[0] += ',';
  if (emp.first_name) parts.push(emp.first_name);
  if (emp.middle_name) parts.push(emp.middle_name.charAt(0) + '.');
  return parts.join(' ');
}

/**
 * Computes whole calendar years in service between date_hired and a reference date,
 * incorporating academic year teaching load deductions for teaching personnel.
 */
export function computeYearsInService(startDate, referenceDate, semesters = [], classification = "") {
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


// ─── Report Definitions ─────────────────────────────────────────────────────

export const REPORT_DEFINITIONS = [
  {
    key: 'masterlist',
    label: 'Employee Masterlist',
    title: 'EMPLOYEE MASTERLIST',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_position',   header: 'POSITION' },
      { key: '_status',     header: 'STATUS' },
      { key: '_tenure',     header: 'TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'rice',
    label: 'Rice Allowance',
    title: 'RICE ALLOWANCE',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'clothing',
    label: 'Clothing Allowance',
    title: 'CLOTHING ALLOWANCE',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'laundry',
    label: 'Laundry Allowance',
    title: 'LAUNDRY ALLOWANCE',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'birthday',
    label: 'Birthday Bonus',
    title: 'BIRTHDAY BONUS',
    columns: [
      { key: '_no',           header: 'NO.' },
      { key: '_id',           header: 'ID' },
      { key: '_name',         header: 'EMPLOYEE NAME' },
      { key: '_department',   header: 'DEPARTMENT' },
      { key: '_tenure',       header: 'EMPLOYMENT TENURE' },
      { key: '_yearsInService', header: 'YEARS IN SERVICE' },
      { key: '_birthDate',    header: 'BIRTH DATE' },
    ],
    showNo: true,
  },
  {
    key: 'summer',
    label: 'Summer Pay',
    title: 'SUMMER PAY',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'thirteenth',
    label: '13th Month Pay',
    title: '13TH MONTH PAY',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'midyear',
    label: 'Midyear Bonus',
    title: 'MIDYEAR BONUS',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
  {
    key: 'service',
    label: 'Service Awardee',
    title: 'SERVICE AWARDEE',
    columns: [
      { key: '_no',           header: 'NO.' },
      { key: '_id',           header: 'ID' },
      { key: '_name',         header: 'EMPLOYEE NAME' },
      { key: '_department',   header: 'DEPARTMENT' },
      { key: '_tenure',       header: 'EMPLOYMENT TENURE' },
      { key: '_yearsInService', header: 'YEARS IN SERVICE' },
      { key: '_serviceAward', header: 'SERVICE AWARD' },
    ],
    showNo: true,
  },
  {
    key: 'retirement',
    label: 'Retirement',
    title: 'RETIREMENT',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'DEPARTMENT' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
    ],
    showNo: true,
  },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
