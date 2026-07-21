// Sanitizers for live input filtering on typing / pasting

// 1. Alpha / Text-Only: Letters (A-Z, a-z), accented letters, spaces, hyphens, apostrophes, dots, commas
export function sanitizeAlphaText(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[^a-zA-Z\u00C0-\u024F\s\-'\.,]/g, '');
}

// 2. Numeric Only (Positive Integers): Digits 0-9
export function sanitizeNumeric(val) {
  if (typeof val !== 'string' && typeof val !== 'number') return '';
  return String(val).replace(/[^0-9]/g, '');
}

// 3. Decimal Numbers: Digits 0-9 and at most one decimal point
export function sanitizeDecimal(val) {
  if (typeof val !== 'string' && typeof val !== 'number') return '';
  let str = String(val).replace(/[^0-9\.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
}

// 4. Phone Numbers: Digits, spaces, hyphens, parentheses, optional leading +
export function sanitizePhone(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[^0-9\s\-\(\)\+]/g, '');
}

// 5. Formatted IDs (SSS, TIN, PhilHealth, PAG-IBIG, PERAA, License No.): Digits, hyphens, spaces, letters
export function sanitizeFormattedId(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[^a-zA-Z0-9\s\-]/g, '');
}

// 6. Strict Email Validation with @universityofbohol.edu.ph requirement
export function validateUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const pattern = /^[a-zA-Z0-9._%+-]+@universityofbohol\.edu\.ph$/;
  return pattern.test(normalized);
}

// Field Type Lookup map
export const FIELD_SANITY_MAP = {
  // Names / Alpha Text
  first_name: 'alpha',
  middle_name: 'alpha',
  last_name: 'alpha',
  titles: 'alpha',
  place_of_birth: 'alpha',
  nationality: 'alpha',
  religion: 'alpha',
  father_name: 'alpha',
  father_occupation: 'alpha',
  mother_maiden_name: 'alpha',
  mother_occupation: 'alpha',
  spouse_name: 'alpha',
  spouse_employer: 'alpha',
  spouse_position: 'alpha',
  spouse_employment_status: 'alpha',
  spouse_gender: 'alpha',
  address_city: 'alpha',
  address_province: 'alpha',
  address_country: 'alpha',
  distinguishing_marks: 'alpha',
  
  // Integers / Counts
  age: 'numeric',
  spouse_age: 'numeric',
  address_zip: 'numeric',
  units: 'numeric',
  years: 'numeric',

  // Decimals
  height: 'decimal',
  weight: 'decimal',
  salary: 'decimal',
  monthly_salary: 'decimal',
  gwa: 'decimal',
  rating: 'decimal',
  budget: 'decimal',

  // Phone
  contact_phone: 'phone',
  mobile: 'phone',
  phone: 'phone',
  office: 'phone',
  home: 'phone',

  // Formatted IDs
  sss: 'id',
  tin: 'id',
  philhealth: 'id',
  pag_ibig: 'id',
  peraa: 'id',
  license_number: 'id',
};

export function sanitizeByFieldName(name, val) {
  const type = FIELD_SANITY_MAP[name];
  if (type === 'alpha') return sanitizeAlphaText(val);
  if (type === 'numeric') return sanitizeNumeric(val);
  if (type === 'decimal') return sanitizeDecimal(val);
  if (type === 'phone') return sanitizePhone(val);
  if (type === 'id') return sanitizeFormattedId(val);
  return val;
}
