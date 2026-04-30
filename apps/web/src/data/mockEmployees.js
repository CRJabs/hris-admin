const employees = [
  {
    id: "temp-1",
    employee_id: "EMP-2024-001",
    first_name: "Juan",
    last_name: "Dela Cruz",
    middle_name: "Santos",
    email: "juan.delacruz@company.ph",
    phone: "+63 917 123 4567",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1990-03-15",
    civil_status: "Married",
    address: "123 Rizal St., Brgy. San Antonio, Makati City",
    department: "Engineering",
    position: "Senior Software Engineer",
    employment_status: "Regular",
    date_hired: "2019-06-15",
    regularization_date: "2020-01-15",
    is_active: true,
    monthly_rate: 85000,
    daily_rate: 3863.64,
    rice_allowance: 2000,
    transportation_allowance: 3000,
    clothing_allowance: 1500,
    salary_history: [
      { date: "2019-06-15", amount: 45000, reason: "Initial Hiring Rate" },
      { date: "2020-06-15", amount: 55000, reason: "Annual Increase" },
      { date: "2021-06-15", amount: 65000, reason: "Promotion to Mid-Level" },
      { date: "2022-06-15", amount: 75000, reason: "Annual Increase" },
      { date: "2023-06-15", amount: 85000, reason: "Promotion to Senior" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 85000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 42500, date: "2025-06-30", status: "Paid" },
      { type: "Summer Pay", amount: 10000, date: "2025-04-15", status: "Paid" },
      { type: "3 Years Bonus", amount: 25000, date: "2022-06-15", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-03-15", status: "Pending" }
    ],
    education: [
      { level: "College", school: "University of the Philippines - Diliman", course: "BS Computer Science", year_graduated: 2012 },
      { level: "High School", school: "Philippine Science High School", course: "", year_graduated: 2008 }
    ],
    trainings: [
      { title: "AWS Solutions Architect Certification", provider: "Amazon Web Services", date: "2024-03-10", hours: 40 },
      { title: "Agile Project Management", provider: "Scrum Alliance", date: "2023-11-20", hours: 16 }
    ],
    licenses: [
      { name: "PRC - Electronics Engineer", number: "ECE-2013-045678", expiry_date: "2026-09-30" }
    ],
    performance_reviews: [
      { period: "2025 H1", rating: 4.5, remarks: "Exceeds expectations. Strong technical leadership.", reviewer: "Maria Santos" },
      { period: "2024 H2", rating: 4.2, remarks: "Consistently delivers quality work.", reviewer: "Maria Santos" },
      { period: "2024 H1", rating: 4.0, remarks: "Good performance, meets all KPIs.", reviewer: "Maria Santos" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 15, vacation_used: 7,
      sick_total: 15, sick_used: 3,
      emergency_total: 3, emergency_used: 1,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2023-06-15", event: "Promoted", details: "Promoted to Senior Software Engineer" },
      { date: "2021-06-15", event: "Promoted", details: "Promoted to Mid-Level Software Engineer" },
      { date: "2020-01-15", event: "Regularized", details: "Converted from Probationary to Regular" },
      { date: "2019-06-15", event: "Hired", details: "Hired as Junior Software Engineer" }
    ]
  },
  {
    id: "temp-2",
    employee_id: "EMP-2024-002",
    first_name: "Maria",
    last_name: "Santos",
    middle_name: "Reyes",
    email: "maria.santos@company.ph",
    phone: "+63 918 234 5678",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1988-07-22",
    civil_status: "Single",
    address: "45 Bonifacio Ave., Brgy. Poblacion, Taguig City",
    department: "Engineering",
    position: "Engineering Manager",
    employment_status: "Regular",
    date_hired: "2017-03-01",
    regularization_date: "2017-09-01",
    is_active: true,
    monthly_rate: 120000,
    daily_rate: 5454.55,
    rice_allowance: 2000,
    transportation_allowance: 5000,
    clothing_allowance: 2000,
    salary_history: [
      { date: "2017-03-01", amount: 60000, reason: "Initial Hiring Rate" },
      { date: "2019-03-01", amount: 80000, reason: "Promotion to Lead" },
      { date: "2021-03-01", amount: 100000, reason: "Promotion to Manager" },
      { date: "2023-03-01", amount: 120000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 120000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 60000, date: "2025-06-30", status: "Paid" },
      { type: "Summer Pay", amount: 15000, date: "2025-04-15", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-07-22", status: "Upcoming" }
    ],
    education: [
      { level: "Master's", school: "Ateneo de Manila University", course: "MBA - Technology Management", year_graduated: 2016 },
      { level: "College", school: "De La Salle University", course: "BS Information Technology", year_graduated: 2010 }
    ],
    trainings: [
      { title: "Leadership Development Program", provider: "DDI Philippines", date: "2024-06-15", hours: 24 },
      { title: "Strategic People Management", provider: "PMAP", date: "2023-09-10", hours: 16 }
    ],
    licenses: [],
    performance_reviews: [
      { period: "2025 H1", rating: 4.8, remarks: "Outstanding leadership and team development.", reviewer: "Carlo Reyes" },
      { period: "2024 H2", rating: 4.6, remarks: "Excellent strategic direction for the team.", reviewer: "Carlo Reyes" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 18, vacation_used: 10,
      sick_total: 15, sick_used: 2,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2021-03-01", event: "Promoted", details: "Promoted to Engineering Manager" },
      { date: "2019-03-01", event: "Promoted", details: "Promoted to Engineering Lead" },
      { date: "2017-09-01", event: "Regularized", details: "Converted to Regular" },
      { date: "2017-03-01", event: "Hired", details: "Hired as Senior Software Engineer" }
    ]
  },
  {
    id: "temp-3",
    employee_id: "EMP-2024-003",
    first_name: "Carlo",
    last_name: "Reyes",
    middle_name: "Gonzales",
    email: "carlo.reyes@company.ph",
    phone: "+63 919 345 6789",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1985-11-08",
    civil_status: "Married",
    address: "78 Quezon Blvd., Brgy. Paligsahan, Quezon City",
    department: "Operations",
    position: "VP of Operations",
    employment_status: "Regular",
    date_hired: "2015-01-10",
    regularization_date: "2015-07-10",
    is_active: true,
    monthly_rate: 180000,
    daily_rate: 8181.82,
    rice_allowance: 2000,
    transportation_allowance: 8000,
    clothing_allowance: 3000,
    salary_history: [
      { date: "2015-01-10", amount: 90000, reason: "Initial Hiring Rate" },
      { date: "2018-01-10", amount: 130000, reason: "Promotion to Director" },
      { date: "2021-01-10", amount: 160000, reason: "Promotion to VP" },
      { date: "2024-01-10", amount: 180000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 180000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 90000, date: "2025-06-30", status: "Paid" },
      { type: "3 Years Bonus", amount: 50000, date: "2024-01-10", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-11-08", status: "Upcoming" }
    ],
    education: [
      { level: "Master's", school: "Asian Institute of Management", course: "Master in Business Administration", year_graduated: 2014 },
      { level: "College", school: "University of Santo Tomas", course: "BS Industrial Engineering", year_graduated: 2007 }
    ],
    trainings: [
      { title: "Executive Leadership Summit", provider: "AIM Executive Education", date: "2024-10-15", hours: 40 }
    ],
    licenses: [
      { name: "PRC - Industrial Engineer", number: "IE-2008-012345", expiry_date: "2025-12-31" }
    ],
    performance_reviews: [
      { period: "2025 H1", rating: 4.7, remarks: "Exceptional operational excellence.", reviewer: "Board of Directors" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 20, vacation_used: 12,
      sick_total: 15, sick_used: 5,
      emergency_total: 3, emergency_used: 2,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2021-01-10", event: "Promoted", details: "Promoted to VP of Operations" },
      { date: "2018-01-10", event: "Promoted", details: "Promoted to Director of Operations" },
      { date: "2015-07-10", event: "Regularized", details: "Converted to Regular" },
      { date: "2015-01-10", event: "Hired", details: "Hired as Operations Manager" }
    ]
  },
  {
    id: "temp-4",
    employee_id: "EMP-2024-004",
    first_name: "Ana",
    last_name: "Garcia",
    middle_name: "Lopez",
    email: "ana.garcia@company.ph",
    phone: "+63 920 456 7890",
    photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1995-01-20",
    civil_status: "Single",
    address: "12 Mabini St., Brgy. San Lorenzo, Makati City",
    department: "Human Resources",
    position: "HR Specialist",
    employment_status: "Probationary",
    date_hired: "2025-01-06",
    regularization_date: "",
    is_active: true,
    monthly_rate: 35000,
    daily_rate: 1590.91,
    rice_allowance: 1500,
    transportation_allowance: 2000,
    clothing_allowance: 0,
    salary_history: [
      { date: "2025-01-06", amount: 35000, reason: "Initial Hiring Rate" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 35000, date: "2025-12-15", status: "Prorated" },
      { type: "Birthday Bonus", amount: 3000, date: "2026-01-20", status: "Upcoming" }
    ],
    education: [
      { level: "College", school: "Polytechnic University of the Philippines", course: "BS Psychology", year_graduated: 2017 }
    ],
    trainings: [
      { title: "HRIS Fundamentals", provider: "PMAP", date: "2025-02-15", hours: 8 }
    ],
    licenses: [],
    performance_reviews: [
      { period: "2025 Q1", rating: 3.8, remarks: "Showing great potential during probation.", reviewer: "Liza Mendoza" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 5, vacation_used: 1,
      sick_total: 5, sick_used: 0,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2025-01-06", event: "Hired", details: "Hired as HR Specialist (Probationary)" }
    ]
  },
  {
    id: "temp-5",
    employee_id: "EMP-2024-005",
    first_name: "Miguel",
    last_name: "Ramos",
    middle_name: "Tan",
    email: "miguel.ramos@company.ph",
    phone: "+63 921 567 8901",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1992-09-03",
    civil_status: "Married",
    address: "56 Aguinaldo St., Brgy. Kapitolyo, Pasig City",
    department: "Finance",
    position: "Senior Accountant",
    employment_status: "Regular",
    date_hired: "2020-02-03",
    regularization_date: "2020-08-03",
    is_active: true,
    monthly_rate: 65000,
    daily_rate: 2954.55,
    rice_allowance: 2000,
    transportation_allowance: 3000,
    clothing_allowance: 1500,
    salary_history: [
      { date: "2020-02-03", amount: 40000, reason: "Initial Hiring Rate" },
      { date: "2021-02-03", amount: 48000, reason: "Annual Increase" },
      { date: "2022-02-03", amount: 55000, reason: "Promotion to Senior" },
      { date: "2024-02-03", amount: 65000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 65000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 32500, date: "2025-06-30", status: "Paid" },
      { type: "3 Years Bonus", amount: 20000, date: "2023-02-03", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-09-03", status: "Upcoming" }
    ],
    education: [
      { level: "College", school: "Far Eastern University", course: "BS Accountancy", year_graduated: 2014 }
    ],
    trainings: [
      { title: "Philippine Tax Updates 2025", provider: "SGV & Co.", date: "2025-01-20", hours: 8 },
      { title: "Advanced Excel & Financial Modeling", provider: "FINEX", date: "2024-05-10", hours: 16 }
    ],
    licenses: [
      { name: "PRC - Certified Public Accountant", number: "CPA-2015-089012", expiry_date: "2027-03-31" }
    ],
    performance_reviews: [
      { period: "2025 H1", rating: 4.3, remarks: "Excellent attention to detail and accuracy.", reviewer: "Patricia Lim" },
      { period: "2024 H2", rating: 4.1, remarks: "Strong contributor to financial reporting.", reviewer: "Patricia Lim" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 15, vacation_used: 5,
      sick_total: 15, sick_used: 4,
      emergency_total: 3, emergency_used: 1,
      maternity_paternity_total: 7, maternity_paternity_used: 7
    },
    employment_history: [
      { date: "2022-02-03", event: "Promoted", details: "Promoted to Senior Accountant" },
      { date: "2020-08-03", event: "Regularized", details: "Converted to Regular" },
      { date: "2020-02-03", event: "Hired", details: "Hired as Junior Accountant" }
    ]
  },
  {
    id: "temp-6",
    employee_id: "EMP-2024-006",
    first_name: "Liza",
    last_name: "Mendoza",
    middle_name: "Aquino",
    email: "liza.mendoza@company.ph",
    phone: "+63 922 678 9012",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1987-05-14",
    civil_status: "Married",
    address: "89 Luna St., Brgy. Bel-Air, Makati City",
    department: "Human Resources",
    position: "HR Director",
    employment_status: "Regular",
    date_hired: "2016-08-01",
    regularization_date: "2017-02-01",
    is_active: true,
    monthly_rate: 130000,
    daily_rate: 5909.09,
    rice_allowance: 2000,
    transportation_allowance: 6000,
    clothing_allowance: 2500,
    salary_history: [
      { date: "2016-08-01", amount: 55000, reason: "Initial Hiring Rate" },
      { date: "2019-08-01", amount: 85000, reason: "Promotion to HR Manager" },
      { date: "2022-08-01", amount: 110000, reason: "Promotion to HR Director" },
      { date: "2024-08-01", amount: 130000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 130000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 65000, date: "2025-06-30", status: "Paid" },
      { type: "Summer Pay", amount: 15000, date: "2025-04-15", status: "Paid" },
      { type: "3 Years Bonus", amount: 40000, date: "2025-08-01", status: "Upcoming" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-05-14", status: "Paid" }
    ],
    education: [
      { level: "Master's", school: "University of the Philippines - Diliman", course: "MA Industrial Relations", year_graduated: 2015 },
      { level: "College", school: "Ateneo de Manila University", course: "BS Management", year_graduated: 2009 }
    ],
    trainings: [
      { title: "HR Analytics Masterclass", provider: "People Matters", date: "2024-11-05", hours: 24 },
      { title: "Employment Law Updates", provider: "DOLE", date: "2025-01-15", hours: 8 }
    ],
    licenses: [],
    performance_reviews: [
      { period: "2025 H1", rating: 4.6, remarks: "Strategic HR leadership with significant culture improvements.", reviewer: "Carlo Reyes" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 20, vacation_used: 8,
      sick_total: 15, sick_used: 2,
      emergency_total: 3, emergency_used: 1,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2022-08-01", event: "Promoted", details: "Promoted to HR Director" },
      { date: "2019-08-01", event: "Promoted", details: "Promoted to HR Manager" },
      { date: "2017-02-01", event: "Regularized", details: "Converted to Regular" },
      { date: "2016-08-01", event: "Hired", details: "Hired as HR Specialist" }
    ]
  },
  {
    id: "temp-7",
    employee_id: "EMP-2024-007",
    first_name: "Roberto",
    last_name: "Villanueva",
    middle_name: "Cruz",
    email: "roberto.villanueva@company.ph",
    phone: "+63 923 789 0123",
    photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1993-12-25",
    civil_status: "Single",
    address: "34 Magsaysay Ave., Brgy. Loyola Heights, Quezon City",
    department: "Marketing",
    position: "Marketing Coordinator",
    employment_status: "Contractual",
    date_hired: "2025-03-01",
    regularization_date: "",
    is_active: true,
    monthly_rate: 28000,
    daily_rate: 1272.73,
    rice_allowance: 1000,
    transportation_allowance: 1500,
    clothing_allowance: 0,
    salary_history: [
      { date: "2025-03-01", amount: 28000, reason: "Contract Rate" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 28000, date: "2025-12-15", status: "Prorated" }
    ],
    education: [
      { level: "College", school: "Adamson University", course: "BS Marketing Management", year_graduated: 2016 }
    ],
    trainings: [],
    licenses: [],
    performance_reviews: [],
    violations: [
      { date: "2025-03-18", type: "Minor", description: "Late submission of marketing report", action_taken: "Verbal Warning" }
    ],
    leave_credits: {
      vacation_total: 5, vacation_used: 0,
      sick_total: 5, sick_used: 1,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2025-03-01", event: "Hired", details: "Hired as Marketing Coordinator (6-month contract)" }
    ]
  },
  {
    id: "temp-8",
    employee_id: "EMP-2024-008",
    first_name: "Patricia",
    last_name: "Lim",
    middle_name: "Ong",
    email: "patricia.lim@company.ph",
    phone: "+63 924 890 1234",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1989-04-30",
    civil_status: "Married",
    address: "67 Ortigas Ave., Brgy. San Antonio, Pasig City",
    department: "Finance",
    position: "Finance Director",
    employment_status: "Regular",
    date_hired: "2016-11-15",
    regularization_date: "2017-05-15",
    is_active: true,
    monthly_rate: 140000,
    daily_rate: 6363.64,
    rice_allowance: 2000,
    transportation_allowance: 6000,
    clothing_allowance: 2500,
    salary_history: [
      { date: "2016-11-15", amount: 60000, reason: "Initial Hiring Rate" },
      { date: "2019-11-15", amount: 90000, reason: "Promotion to Finance Manager" },
      { date: "2022-11-15", amount: 120000, reason: "Promotion to Finance Director" },
      { date: "2024-11-15", amount: 140000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 140000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 70000, date: "2025-06-30", status: "Paid" },
      { type: "3 Years Bonus", amount: 40000, date: "2025-11-15", status: "Upcoming" }
    ],
    education: [
      { level: "Master's", school: "De La Salle University", course: "Master of Science in Accounting", year_graduated: 2015 },
      { level: "College", school: "University of the Philippines - Diliman", course: "BS Business Administration & Accountancy", year_graduated: 2011 }
    ],
    trainings: [
      { title: "IFRS Updates 2025", provider: "Philippine Institute of CPAs", date: "2025-02-20", hours: 16 }
    ],
    licenses: [
      { name: "PRC - Certified Public Accountant", number: "CPA-2012-056789", expiry_date: "2026-06-30" },
      { name: "Certified Management Accountant", number: "CMA-2018-001234", expiry_date: "2026-12-31" }
    ],
    performance_reviews: [
      { period: "2025 H1", rating: 4.7, remarks: "Exceptional financial stewardship.", reviewer: "Carlo Reyes" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 20, vacation_used: 14,
      sick_total: 15, sick_used: 3,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 105, maternity_paternity_used: 105
    },
    employment_history: [
      { date: "2022-11-15", event: "Promoted", details: "Promoted to Finance Director" },
      { date: "2019-11-15", event: "Promoted", details: "Promoted to Finance Manager" },
      { date: "2017-05-15", event: "Regularized", details: "Converted to Regular" },
      { date: "2016-11-15", event: "Hired", details: "Hired as Senior Accountant" }
    ]
  },
  {
    id: "temp-9",
    employee_id: "EMP-2024-009",
    first_name: "Diego",
    last_name: "Bautista",
    middle_name: "Fernandez",
    email: "diego.bautista@company.ph",
    phone: "+63 925 901 2345",
    photo_url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1991-08-17",
    civil_status: "Single",
    address: "23 Shaw Blvd., Brgy. Highway Hills, Mandaluyong City",
    department: "Engineering",
    position: "Full-Stack Developer",
    employment_status: "Regular",
    date_hired: "2021-09-01",
    regularization_date: "2022-03-01",
    is_active: true,
    monthly_rate: 60000,
    daily_rate: 2727.27,
    rice_allowance: 2000,
    transportation_allowance: 3000,
    clothing_allowance: 1500,
    salary_history: [
      { date: "2021-09-01", amount: 42000, reason: "Initial Hiring Rate" },
      { date: "2022-09-01", amount: 50000, reason: "Annual Increase" },
      { date: "2024-09-01", amount: 60000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 60000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 30000, date: "2025-06-30", status: "Paid" },
      { type: "3 Years Bonus", amount: 15000, date: "2024-09-01", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-08-17", status: "Upcoming" }
    ],
    education: [
      { level: "College", school: "Mapua University", course: "BS Computer Engineering", year_graduated: 2013 }
    ],
    trainings: [
      { title: "React Advanced Patterns", provider: "Frontend Masters", date: "2024-08-15", hours: 12 },
      { title: "DevOps Engineering on AWS", provider: "AWS Training", date: "2024-04-20", hours: 32 }
    ],
    licenses: [],
    performance_reviews: [
      { period: "2025 H1", rating: 4.0, remarks: "Solid technical skills, improving leadership.", reviewer: "Maria Santos" },
      { period: "2024 H2", rating: 3.8, remarks: "Good work on the platform migration project.", reviewer: "Maria Santos" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 15, vacation_used: 9,
      sick_total: 15, sick_used: 6,
      emergency_total: 3, emergency_used: 2,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2022-03-01", event: "Regularized", details: "Converted to Regular" },
      { date: "2021-09-01", event: "Hired", details: "Hired as Full-Stack Developer" }
    ]
  },
  {
    id: "temp-10",
    employee_id: "EMP-2024-010",
    first_name: "Camille",
    last_name: "Tan",
    middle_name: "Go",
    email: "camille.tan@company.ph",
    phone: "+63 926 012 3456",
    photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1996-06-11",
    civil_status: "Single",
    address: "15 Katipunan Ave., Brgy. Loyola Heights, Quezon City",
    department: "Marketing",
    position: "Digital Marketing Manager",
    employment_status: "Regular",
    date_hired: "2021-04-15",
    regularization_date: "2021-10-15",
    is_active: true,
    monthly_rate: 55000,
    daily_rate: 2500,
    rice_allowance: 2000,
    transportation_allowance: 3000,
    clothing_allowance: 1500,
    salary_history: [
      { date: "2021-04-15", amount: 35000, reason: "Initial Hiring Rate" },
      { date: "2022-04-15", amount: 42000, reason: "Annual Increase" },
      { date: "2023-04-15", amount: 48000, reason: "Promotion to Manager" },
      { date: "2024-04-15", amount: 55000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 55000, date: "2025-12-15", status: "Paid" },
      { type: "Mid-Year Bonus", amount: 27500, date: "2025-06-30", status: "Paid" },
      { type: "Summer Pay", amount: 8000, date: "2025-04-15", status: "Paid" },
      { type: "Birthday Bonus", amount: 5000, date: "2025-06-11", status: "Paid" }
    ],
    education: [
      { level: "College", school: "De La Salle University", course: "BS Marketing Communications", year_graduated: 2018 }
    ],
    trainings: [
      { title: "Google Ads Certification", provider: "Google", date: "2024-07-10", hours: 20 },
      { title: "Social Media Strategy", provider: "HubSpot Academy", date: "2024-01-15", hours: 12 }
    ],
    licenses: [],
    performance_reviews: [
      { period: "2025 H1", rating: 4.4, remarks: "Strong campaign performance, 30% lead increase.", reviewer: "Carlo Reyes" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 15, vacation_used: 6,
      sick_total: 15, sick_used: 2,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2023-04-15", event: "Promoted", details: "Promoted to Digital Marketing Manager" },
      { date: "2021-10-15", event: "Regularized", details: "Converted to Regular" },
      { date: "2021-04-15", event: "Hired", details: "Hired as Marketing Associate" }
    ]
  },
  {
    id: "temp-11",
    employee_id: "EMP-2024-011",
    first_name: "Rafael",
    last_name: "Aquino",
    middle_name: "Torres",
    email: "rafael.aquino@company.ph",
    phone: "+63 927 123 4567",
    photo_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    gender: "Male",
    birthdate: "1994-02-28",
    civil_status: "Single",
    address: "45 EDSA, Brgy. Guadalupe, Makati City",
    department: "Operations",
    position: "Operations Analyst",
    employment_status: "Probationary",
    date_hired: "2025-02-01",
    regularization_date: "",
    is_active: true,
    monthly_rate: 32000,
    daily_rate: 1454.55,
    rice_allowance: 1500,
    transportation_allowance: 2000,
    clothing_allowance: 0,
    salary_history: [
      { date: "2025-02-01", amount: 32000, reason: "Initial Hiring Rate" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 32000, date: "2025-12-15", status: "Prorated" }
    ],
    education: [
      { level: "College", school: "Technological University of the Philippines", course: "BS Industrial Engineering", year_graduated: 2016 }
    ],
    trainings: [],
    licenses: [],
    performance_reviews: [],
    violations: [],
    leave_credits: {
      vacation_total: 5, vacation_used: 0,
      sick_total: 5, sick_used: 1,
      emergency_total: 3, emergency_used: 0,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2025-02-01", event: "Hired", details: "Hired as Operations Analyst (Probationary)" }
    ]
  },
  {
    id: "temp-12",
    employee_id: "EMP-2024-012",
    first_name: "Isabella",
    last_name: "Fernandez",
    middle_name: "Rivera",
    email: "isabella.fernandez@company.ph",
    phone: "+63 928 234 5678",
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    gender: "Female",
    birthdate: "1991-10-05",
    civil_status: "Married",
    address: "78 Roxas Blvd., Brgy. Ermita, Manila",
    department: "Legal",
    position: "Corporate Counsel",
    employment_status: "Regular",
    date_hired: "2019-11-01",
    regularization_date: "2020-05-01",
    is_active: false,
    monthly_rate: 95000,
    daily_rate: 4318.18,
    rice_allowance: 2000,
    transportation_allowance: 4000,
    clothing_allowance: 2000,
    salary_history: [
      { date: "2019-11-01", amount: 70000, reason: "Initial Hiring Rate" },
      { date: "2021-11-01", amount: 80000, reason: "Annual Increase" },
      { date: "2023-11-01", amount: 95000, reason: "Annual Increase" }
    ],
    bonuses: [
      { type: "13th Month Pay", amount: 95000, date: "2024-12-15", status: "Paid" }
    ],
    education: [
      { level: "Law", school: "Ateneo de Manila University - School of Law", course: "Juris Doctor", year_graduated: 2017 },
      { level: "College", school: "University of the Philippines - Diliman", course: "BA Political Science", year_graduated: 2013 }
    ],
    trainings: [
      { title: "Data Privacy Act Compliance", provider: "National Privacy Commission", date: "2024-03-15", hours: 8 }
    ],
    licenses: [
      { name: "Philippine Bar", number: "BAR-2018-006789", expiry_date: "Lifetime" }
    ],
    performance_reviews: [
      { period: "2024 H2", rating: 4.4, remarks: "Excellent legal advisory and contract reviews.", reviewer: "Carlo Reyes" }
    ],
    violations: [],
    leave_credits: {
      vacation_total: 15, vacation_used: 15,
      sick_total: 15, sick_used: 10,
      emergency_total: 3, emergency_used: 3,
      maternity_paternity_total: 0, maternity_paternity_used: 0
    },
    employment_history: [
      { date: "2025-01-31", event: "Deactivated", details: "Resigned - Career change" },
      { date: "2020-05-01", event: "Regularized", details: "Converted to Regular" },
      { date: "2019-11-01", event: "Hired", details: "Hired as Corporate Counsel" }
    ]
  }
];

export default employees;