import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// ─── Formatters & Helpers ───────────────────────────────────────────────────

function formatBirthDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function formatEmployeeName(emp) {
  const parts = [emp.last_name];
  if (emp.first_name) parts[0] += ',';
  if (emp.first_name) parts.push(emp.first_name);
  if (emp.middle_name) parts.push(emp.middle_name.charAt(0) + '.');
  return parts.join(' ');
}

function computeYearsInService(startDate, referenceDate, semesters = [], classification = "") {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const ref = new Date(new Date(referenceDate).getTime() + 86400000);
  if (isNaN(start.getTime())) return 0;

  let years = ref.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - start.getUTCMonth();
  const dayDiff = ref.getUTCDate() - start.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years--;
  let yearsInService = Math.max(0, years);

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

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase server environment variables" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    if (token === "debug-token" && process.env.NODE_ENV !== "production") {
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

    const { month, year } = req.body;
    const selectedMonth = typeof month === 'number' ? month : new Date().getMonth();
    const selectedYear = typeof year === 'number' ? year : new Date().getFullYear();

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch active employees and semesters in parallel
    const [empRes, semRes, benefitsRes] = await Promise.all([
      adminClient.from('employees').select('*').eq('is_active', true),
      adminClient.from('employee_semesters').select('*'),
      adminClient.from('employee_benefits').select('*').eq('eligibility_year', selectedYear),
    ]);

    if (empRes.error) throw empRes.error;
    if (semRes.error) throw semRes.error;
    if (benefitsRes.error) throw benefitsRes.error;

    const employees = empRes.data || [];
    const semesters = semRes.data || [];
    const benefitsData = benefitsRes.data || [];

    // Map benefits: employee_id -> benefit_key -> row
    const benefitsByEmployee = {};
    let latestComputed = null;
    benefitsData.forEach(row => {
      if (!benefitsByEmployee[row.employee_id]) {
        benefitsByEmployee[row.employee_id] = {};
      }
      benefitsByEmployee[row.employee_id][row.benefit_key] = row;
      if (row.computed_at) {
        const d = new Date(row.computed_at);
        if (!latestComputed || d > latestComputed) latestComputed = d;
      }
    });

    // Map semesters: employee_id -> array of semesters
    const semestersByEmployee = {};
    semesters.forEach(row => {
      if (!semestersByEmployee[row.employee_id]) {
        semestersByEmployee[row.employee_id] = [];
      }
      semestersByEmployee[row.employee_id].push(row);
    });

    const referenceDate = new Date(Date.UTC(selectedYear, selectedMonth, 15));

    // 2. Masterlist
    const masterlist = employees
      .filter(emp => emp.is_active)
      .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
      .map((emp, i) => ({
        _no: i + 1,
        _id: emp.employee_id,
        _name: formatEmployeeName(emp),
        _department: emp.department || '—',
        _position: emp.position || '—',
        _status: emp.employment_status || '—',
        _tenure: emp.employment_tenure || '—',
      }));

    // Helper filter
    const filterEligible = (benefitKey) => {
      return employees
        .filter(emp => {
          if (!emp.is_active) return false;
          const benefitRow = benefitsByEmployee[emp.id]?.[benefitKey];
          return benefitRow?.is_eligible === true;
        })
        .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    };

    // Allowances
    const rice = filterEligible('rice_clothing_laundry').map((emp, i) => ({
      _no: i + 1,
      _id: emp.employee_id,
      _name: formatEmployeeName(emp),
      _department: emp.department || '—',
      _tenure: emp.employment_tenure || '—',
    }));

    const clothing = [...rice];
    const laundry = [...rice];

    // Birthday
    const birthday = employees
      .filter(emp => {
        if (!emp.is_active) return false;
        const benefitRow = benefitsByEmployee[emp.id]?.birthday_bonus;
        if (!benefitRow?.is_eligible) return false;
        if (!emp.birthdate) return false;
        const bday = new Date(emp.birthdate);
        return !isNaN(bday.getTime()) && bday.getUTCMonth() === selectedMonth;
      })
      .sort((a, b) => {
        const dayA = new Date(a.birthdate).getDate();
        const dayB = new Date(b.birthdate).getDate();
        return dayA - dayB;
      })
      .map((emp, i) => ({
        _no: i + 1,
        _id: emp.employee_id,
        _name: formatEmployeeName(emp),
        _department: emp.department || '—',
        _tenure: emp.employment_tenure || '—',
        _yearsInService: computeYearsInService(emp.date_hired, referenceDate, semestersByEmployee[emp.id] || [], emp.employment_classification),
        _birthDate: formatBirthDate(emp.birthdate),
      }));

    // Summer Pay
    const summer = filterEligible('summer_pay').map((emp, i) => ({
      _no: i + 1,
      _id: emp.employee_id,
      _name: formatEmployeeName(emp),
      _department: emp.department || '—',
      _tenure: emp.employment_tenure || '—',
    }));

    // 13th Month Pay
    const thirteenth = filterEligible('thirteenth_month').map((emp, i) => ({
      _no: i + 1,
      _id: emp.employee_id,
      _name: formatEmployeeName(emp),
      _department: emp.department || '—',
      _tenure: emp.employment_tenure || '—',
    }));

    // Midyear Bonus
    const midyear = filterEligible('midyear_bonus').map((emp, i) => ({
      _no: i + 1,
      _id: emp.employee_id,
      _name: formatEmployeeName(emp),
      _department: emp.department || '—',
      _tenure: emp.employment_tenure || '—',
    }));

    // Service Award
    const service = employees
      .filter(emp => {
        if (!emp.is_active) return false;
        const benefitRow = benefitsByEmployee[emp.id]?.service_award;
        return benefitRow?.is_eligible === true;
      })
      .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
      .map((emp, i) => {
        const benefitRow = benefitsByEmployee[emp.id]?.service_award;
        return {
          _no: i + 1,
          _id: emp.employee_id,
          _name: formatEmployeeName(emp),
          _department: emp.department || '—',
          _tenure: emp.employment_tenure || '—',
          _yearsInService: computeYearsInService(emp.date_hired, referenceDate, semestersByEmployee[emp.id] || [], emp.employment_classification),
          _serviceAward: benefitRow?.award_level || '—',
        };
      });

    // Retirement
    const retirement = filterEligible('retirement').map((emp, i) => ({
      _no: i + 1,
      _id: emp.employee_id,
      _name: formatEmployeeName(emp),
      _department: emp.department || '—',
      _tenure: emp.employment_tenure || '—',
    }));

    const formattedLastComputed = latestComputed
      ? latestComputed.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null;

    return res.status(200).json({
      success: true,
      data: {
        masterlist,
        rice,
        clothing,
        laundry,
        birthday,
        summer,
        thirteenth,
        midyear,
        service,
        retirement
      },
      meta: {
        lastComputedAt: formattedLastComputed,
        hasDataForYear: benefitsData.length > 0,
        totalEmployees: employees.length
      }
    });
  } catch (error) {
    console.error("Error in get-report-data:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
