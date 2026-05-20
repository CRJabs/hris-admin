/**
 * @deprecated Use the `useOrgDepartments` hook instead.
 * This static list is kept as a fallback only and will be removed once
 * all consumers have been fully migrated to the live Supabase-driven hook.
 */
export const DEPARTMENTS = [

  "College of Engineering, Technology, Architecture, and Fine Arts",
  "College of Allied Health Sciences",
  "College of Arts, Sciences, and Education",
  "College of Physical Therapy and Occupational Therapy",
  "College of Criminal Justice",
  "College of Pharmacy",
  "College of Hospitality Management, Tourism, and Nutrition",
  "College of Business and Accountancy",
  "College of Law",
  "Graduate School",
  "UBVDTALC Senior High School",
  "UBDVDTALC Junior High School",
  "UB Junior High School",
  "UB Grade School",
  "Guidance Center",
  "Human Resources",
  "Registrar",
  "Finance",
  "Marketing",
  "General Services Officer",
  "MIS"
];

export const EMPLOYMENT_CLASSIFICATIONS = [
  "Executive",
  "Academic Official",
  "Administrative Official",
  "Teaching",
  "Non-Teaching",
  "Consultant"
];

export const BENEFIT_KEYS = {
  RICE_CLOTHING_LAUNDRY: 'rice_clothing_laundry',
  BIRTHDAY_BONUS: 'birthday_bonus',
  SUMMER_PAY: 'summer_pay',
  THIRTEENTH_MONTH: 'thirteenth_month',
  MIDYEAR_BONUS: 'midyear_bonus',
  SERVICE_AWARD: 'service_award',
  RETIREMENT: 'retirement'
};

export const BENEFIT_CONFIG = {
  [BENEFIT_KEYS.RICE_CLOTHING_LAUNDRY]: {
    label: 'Rice, Clothing & Laundry',
    icon: 'ShoppingBag'
  },
  [BENEFIT_KEYS.BIRTHDAY_BONUS]: {
    label: 'Birthday Bonus',
    icon: 'Gift'
  },
  [BENEFIT_KEYS.SUMMER_PAY]: {
    label: 'Summer Pay',
    icon: 'Sun'
  },
  [BENEFIT_KEYS.THIRTEENTH_MONTH]: {
    label: '13th Month Pay',
    icon: 'Calendar'
  },
  [BENEFIT_KEYS.MIDYEAR_BONUS]: {
    label: 'Midyear Bonus',
    icon: 'Star'
  },
  [BENEFIT_KEYS.SERVICE_AWARD]: {
    label: 'Service Award',
    icon: 'Heart'
  },
  [BENEFIT_KEYS.RETIREMENT]: {
    label: 'Retirement Benefit',
    icon: 'LogOut'
  }
};
