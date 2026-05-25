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
