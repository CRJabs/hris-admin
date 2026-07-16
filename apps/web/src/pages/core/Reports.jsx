import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Download, Search, ChevronLeft, ChevronRight,
  Users, Loader2, AlertCircle, FileBarChart2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
// ─── Constants & UI Schema ──────────────────────────────────────────────────

const REPORT_DEFINITIONS = [
  {
    key: 'masterlist',
    label: 'Employee Masterlist',
    title: 'EMPLOYEE MASTERLIST',
    columns: [
      { key: '_no',         header: 'NO.' },
      { key: '_id',         header: 'ID' },
      { key: '_name',       header: 'EMPLOYEE NAME' },
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_position',   header: 'POSITION' },
      { key: '_status',     header: 'EMP. STATUS' },
      { key: '_tenure',     header: 'EMPLOYMENT TENURE' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_name',         header: 'NAME' },
      { key: '_status',       header: 'EMPLOYMENT STATUS' },
      { key: '_longevity',    header: 'LONGEVITY' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
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
      { key: '_name',         header: 'NAME' },
      { key: '_department',   header: 'COLLEGE/DEPT' },
      { key: '_tenure',       header: 'EMPLOYMENT STATUS' },
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
      { key: '_department', header: 'COLLEGE/DEPT' },
      { key: '_tenure',     header: 'EMP. STATUS' },
    ],
    showNo: true,
  },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];


// ─── Constants ──────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 25;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ─── PDF Export ─────────────────────────────────────────────────────────────

// ─── PDF Export ─────────────────────────────────────────────────────────────

async function generatePDF(reportKey, allReportData, reportMonthLabel, selectedYear, definitions, userEmail) {
  const { default: jsPDF } = await import('jspdf');

  toast.info('Preparing PDF export…', { duration: 3000 });

  // Letter size in mm: 215.9 × 279.4
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = 215.9;
  const pageH = 279.4;
  const margin = 12.7; // 0.5" margin each side
  const contentW = pageW - margin * 2;
  const headerH = 25.4; // 1" tall header image

  // Fetch position holders from employees table to dynamically insert names if assigned
  let officeAssistantName = '';
  let hrManagerName = '';
  let vpAdminName = '';

  try {
    const { data: emps } = await supabase
      .from('employees')
      .select('first_name, last_name, middle_name, position')
      .eq('is_active', true);

    if (emps && emps.length > 0) {
      const findByPos = (title) => {
        const found = emps.find(e => e.position && e.position.toLowerCase().includes(title.toLowerCase()));
        if (!found) return '';
        const parts = [found.first_name];
        if (found.middle_name) parts.push(found.middle_name.charAt(0) + '.');
        parts.push(found.last_name);
        return parts.join(' ');
      };

      officeAssistantName = findByPos('office assistant');
      hrManagerName = findByPos('human resource manager') || findByPos('hr manager');
      vpAdminName = findByPos('vice president for administration') || findByPos('vp for administration');
    }
  } catch (err) {
    console.warn('Could not fetch position holders for PDF signatories:', err);
  }

  // Helper to load header image as base64
  async function getHeaderImage() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => resolve(null);
      img.src = '/report-header.jpg';
    });
  }

  // Helper: draw footer on current page
  function drawFooter() {
    const footerY = pageH - 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const displayEmail = userEmail || 'admin@universityofbohol.edu.ph';
    pdf.text(`${displayEmail}        (038) 411-3101`, pageW / 2, footerY, { align: 'center' });
  }

  // Helper: render one report section to the pdf
  async function renderReport(def, data, isFirst) {
    if (!isFirst) pdf.addPage();

    const headerB64 = await getHeaderImage();
    if (headerB64) {
      pdf.addImage(headerB64, 'JPEG', margin, margin, contentW, headerH);
    }

    // Title block formatting per report type
    let cursorY = margin + headerH + 7;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(20, 20, 20);

    if (def.key === 'birthday') {
      pdf.setFontSize(11);
      pdf.text('BIRTHDAY CELEBRANTS', pageW / 2, cursorY, { align: 'center' });
      cursorY += 5;
      pdf.setFontSize(10);
      pdf.text(reportMonthLabel.toUpperCase(), pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    } else if (def.key === 'rice') {
      pdf.setFontSize(9);
      pdf.text('LIST OF EMPLOYEES (REGULAR AND NON-REGULAR TEACHING AND NON-TEACHING PERSONNEL)', pageW / 2, cursorY, { align: 'center' });
      cursorY += 4.5;
      pdf.setFontSize(9);
      pdf.text(`RICE ALLOWANCE FOR THE MONTH OF ${reportMonthLabel.toUpperCase()}`, pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    } else if (['clothing', 'laundry', 'summer', 'thirteenth', 'midyear'].includes(def.key)) {
      const labels = {
        clothing: `FOR THE RELEASE OF CLOTHING ALLOWANCE ${selectedYear}`,
        laundry: `FOR THE RELEASE OF LAUNDRY ALLOWANCE ${selectedYear}`,
        summer: `FOR THE RELEASE OF SUMMER PAY ${selectedYear}`,
        thirteenth: `FOR THE RELEASE OF 13TH MONTH PAY ${selectedYear}`,
        midyear: `FOR THE RELEASE OF MIDYEAR BONUS ${selectedYear}`,
      };
      pdf.setFontSize(9);
      pdf.text('LIST OF EMPLOYEES (REGULAR AND NON-REGULAR TEACHING AND NON-TEACHING PERSONNEL)', pageW / 2, cursorY, { align: 'center' });
      cursorY += 4.5;
      pdf.setFontSize(9);
      pdf.text(labels[def.key], pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    } else if (def.key === 'service') {
      pdf.setFontSize(9);
      pdf.text('LIST OF EMPLOYEES (REGULAR AND NON-REGULAR TEACHING AND NON-TEACHING PERSONNEL)', pageW / 2, cursorY, { align: 'center' });
      cursorY += 4.5;
      pdf.setFontSize(9);
      pdf.text(`SERVICE AWARDEES FOR THE YEAR ${selectedYear}`, pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    } else if (def.key === 'retirement') {
      pdf.setFontSize(10);
      pdf.text(`LIST OF EMPLOYEES ELIGIBLE FOR RETIREMENT FOR THE YEAR ${selectedYear}`, pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    } else {
      pdf.setFontSize(11);
      pdf.text(def.title, pageW / 2, cursorY, { align: 'center' });
      cursorY += 5;
      pdf.setFontSize(9);
      pdf.text(`AS OF ${reportMonthLabel.toUpperCase()}`, pageW / 2, cursorY, { align: 'center' });
      cursorY += 7;
    }

    if (data.length === 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text('No eligible employees found for this report.', pageW / 2, cursorY + 8, { align: 'center' });
      drawFooter();
      return;
    }

    // --- Table drawing ---
    const cols = def.columns;
    const colCount = cols.length;
    const colW = contentW / colCount;
    const rowH = 6.5;
    const headerRowH = 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(20, 20, 20);

    // Header row background
    pdf.setFillColor(235, 238, 242);
    pdf.rect(margin, cursorY, contentW, headerRowH, 'F');

    // Header cells
    cols.forEach((col, ci) => {
      const x = margin + ci * colW;
      pdf.rect(x, cursorY, colW, headerRowH);
      pdf.text(col.header, x + colW / 2, cursorY + headerRowH / 2 + 1, { align: 'center', baseline: 'middle' });
    });
    cursorY += headerRowH;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);

    data.forEach((row, ri) => {
      // Page break check
      if (cursorY + rowH > pageH - 55) {
        drawFooter();
        pdf.addPage();
        cursorY = margin;

        // Repeat header on new page
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setFillColor(235, 238, 242);
        pdf.rect(margin, cursorY, contentW, headerRowH, 'F');
        cols.forEach((col, ci) => {
          const x = margin + ci * colW;
          pdf.rect(x, cursorY, colW, headerRowH);
          pdf.text(col.header, x + colW / 2, cursorY + headerRowH / 2 + 1, { align: 'center', baseline: 'middle' });
        });
        cursorY += headerRowH;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
      }

      // Alternating row background
      if (ri % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, cursorY, contentW, rowH, 'F');
      }

      cols.forEach((col, ci) => {
        const x = margin + ci * colW;
        const val = String(row[col.key] ?? '—');
        pdf.rect(x, cursorY, colW, rowH);

        if (col.key === '_no' || col.key === '_id') {
          pdf.text(val, x + colW / 2, cursorY + rowH / 2 + 0.8, { align: 'center', baseline: 'middle' });
        } else {
          pdf.text(val, x + 2, cursorY + rowH / 2 + 0.8, { baseline: 'middle', maxWidth: colW - 4 });
        }
      });
      cursorY += rowH;
    });

    // --- Signatories section ---
    // Ensure signatories fit on the page
    if (cursorY + 45 > pageH - 15) {
      drawFooter();
      pdf.addPage();
      cursorY = margin + 10;
    } else {
      cursorY += 12;
    }

    pdf.setTextColor(20, 20, 20);

    if (def.key === 'birthday') {
      // Birthday Bonus Signatory (Approved by VP Admin)
      const sigX = margin + contentW * 0.65;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Approved:', sigX, cursorY);
      cursorY += 12;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      if (vpAdminName) pdf.text(vpAdminName, sigX, cursorY);
      cursorY += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.text('Vice President for Administration', sigX, cursorY);
    } else {
      // Standard 3-column Signatories
      const colWidth3 = contentW / 3;

      // Labels row
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('Prepared by:', margin, cursorY);
      pdf.text('Checked by:', margin + colWidth3, cursorY);
      pdf.text('Recommending Approval:', margin + colWidth3 * 2, cursorY);

      cursorY += 14;

      // Names row (printed if position holder assigned, left blank space if empty)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      if (officeAssistantName) pdf.text(officeAssistantName, margin, cursorY);
      if (hrManagerName) pdf.text(hrManagerName, margin + colWidth3, cursorY);
      if (vpAdminName) pdf.text(vpAdminName, margin + colWidth3 * 2, cursorY);

      cursorY += 4;

      // Position Titles row
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Office Assistant', margin, cursorY);
      pdf.text('Human Resource Manager', margin + colWidth3, cursorY);
      pdf.text('Vice President for Administration', margin + colWidth3 * 2, cursorY);
    }

    drawFooter();
  }

  // ── Determine which reports to render ──
  const toRender =
    reportKey === 'full'
      ? definitions
      : definitions.filter(d => d.key === reportKey);

  for (let i = 0; i < toRender.length; i++) {
    const def = toRender[i];
    const data = allReportData[def.key] || [];
    await renderReport(def, data, i === 0);
  }

  const fileName = reportKey === 'full'
    ? `HRIS_Full_Report_${reportMonthLabel.replace(/\s+/g, '_')}.pdf`
    : `HRIS_${reportKey}_${reportMonthLabel.replace(/\s+/g, '_')}.pdf`;

  pdf.save(fileName);
  toast.success('PDF exported successfully!');
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ReportTable({ def, data, searchQuery }) {
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));

  // Reset to page 1 whenever data or search changes
  useEffect(() => {
    setPage(1);
    setPageInput('1');
  }, [filtered.length, def.key]);

  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const goTo = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed)) goTo(parsed);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <AlertCircle className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">No eligible employees found for this report</p>
        {searchQuery && (
          <p className="text-xs opacity-70">Try clearing the search filter</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-[#0C005F] text-white">
              {def.columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider uppercase whitespace-nowrap border border-[#0a0050]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, ri) => (
              <tr
                key={ri}
                className={`transition-colors hover:bg-blue-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                {def.columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 border border-slate-200 text-xs ${
                      col.key === '_no' ? 'text-center font-medium text-muted-foreground w-12' : ''
                    } ${col.key === '_id' ? 'font-mono text-muted-foreground' : ''}`}
                  >
                    {String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/80 rounded-b-xl mt-auto gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">
            {((page - 1) * ROWS_PER_PAGE) + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          {filtered.length !== 1 ? 'entries' : 'entry'}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          {/* Page number input */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Page</span>
            <Input
              className="h-7 w-12 text-center text-xs px-1"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={() => {
                const parsed = parseInt(pageInput, 10);
                if (!isNaN(parsed)) goTo(parsed);
                else setPageInput(String(page));
              }}
            />
            <span>of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Full Report View ────────────────────────────────────────────────────────

function FullReportView({ allReportData, searchQuery, reportMonthLabel }) {
  return (
    <div className="space-y-8">
      {REPORT_DEFINITIONS.map((def, idx) => {
        const data = allReportData[def.key] || [];
        return (
          <div key={def.key} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0C005F]/5 to-transparent border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0C005F]/50 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{def.title}</h3>
              </div>
              <span className="text-xs text-muted-foreground">{data.length} employee{data.length !== 1 ? 's' : ''}</span>
            </div>
            <ReportTable def={def} data={data} searchQuery={searchQuery} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Reports() {
  const today = new Date();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('masterlist');
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());   // 0-indexed
  const [selectedYear, setSelectedYear]   = useState(today.getFullYear());
  const [searchQuery, setSearchQuery]     = useState('');
  const [isLoading, setIsLoading]         = useState(true);
  const [allReportData, setAllReportData] = useState({});
  const [meta, setMeta]                   = useState({ lastComputedAt: null, hasDataForYear: false });
  const [isExporting, setIsExporting]     = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const scrollRef = useRef(null);

  // Fetch pre-shaped report data from serverless API
  const fetchReportData = useCallback(async (month, year) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/get-report-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ month, year }),
      });
      const res = await response.json();
      if (res && res.success) {
        setAllReportData(res.data || {});
        setMeta(res.meta || { lastComputedAt: null, hasDataForYear: false });
      } else {
        throw new Error(res?.error || 'Failed to fetch report data');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchReportData]);

  // Derived state shortcuts
  const hasDataForYear = meta.hasDataForYear;
  const lastComputedDate = meta.lastComputedAt;

  // Trigger daily computation batch manually
  const handleRecompute = async () => {
    if (isRecomputing) return;
    setIsRecomputing(true);
    const toastId = toast.loading(`Recomputing employee benefits eligibility for ${selectedYear}...`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/run-benefits-computation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ year: selectedYear }),
      });
      const res = await response.json();
      if (res && res.success) {
        toast.success(`Computation successful! Processed ${res.count} employees.`, { id: toastId });
        await fetchReportData(selectedMonth, selectedYear);
        localStorage.removeItem('lastBenefitsRun');
      } else {
        throw new Error(res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Recomputation failed: ${err.message}`, { id: toastId });
    } finally {
      setIsRecomputing(false);
    }
  };

  const reportMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const activeDefinition = REPORT_DEFINITIONS.find(d => d.key === selectedReport);
  const activeData = allReportData[selectedReport] || [];

  // ── PDF Export ──
  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await generatePDF(selectedReport, allReportData, reportMonthLabel, selectedYear, REPORT_DEFINITIONS, user?.email);
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, selectedReport, allReportData, reportMonthLabel, selectedYear, user?.email]);

  // ── Clear search when switching reports ──
  useEffect(() => {
    setSearchQuery('');
  }, [selectedReport]);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-6 gap-5 max-w-[1440px] mx-auto w-full">

      {/* ── Top Controls & Report Buttons (single bar, 3 sections) ── */}
      <div className="flex flex-col w-full">

        {/* Column labels row */}
        <div className="flex w-full mb-1">
          <div style={{ width: '80%', flexShrink: 0 }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0C005F]/50 pl-1">Reports</span>
          </div>
          <div style={{ width: '20%', flexShrink: 0 }} className="flex justify-end pr-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0C005F]/50">Exporting</span>
          </div>
        </div>

        {/* The bar itself */}
        <div className="flex items-stretch w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Section 1 — Full Report (10%) */}
          <div className="flex items-center justify-center px-3 py-2 border-r border-slate-200" style={{ width: '10%', minWidth: 0, flexShrink: 0 }}>
            <button
              id="report-btn-full"
              onClick={() => setSelectedReport('full')}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                selectedReport === 'full'
                  ? 'bg-[#0C005F] text-white border-[#0C005F] shadow-sm'
                  : 'bg-white text-foreground border-slate-200 hover:border-[#0C005F]/40 hover:text-[#0C005F] hover:bg-[#0C005F]/5'
              }`}
            >
              <FileText className="w-3 h-3 shrink-0" />
              Full Report
            </button>
          </div>

          {/* Section 2 — L/R arrow buttons + scrollable report buttons (65%) */}
          <div className="flex items-stretch border-r border-slate-200" style={{ width: '65%', minWidth: 0, flexShrink: 0 }}>
            {/* Left scroll button */}
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
              className="flex items-center justify-center px-2 shrink-0 text-slate-400 hover:text-[#0C005F] hover:bg-slate-50 border-r border-slate-200 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable strip — scrollbar hidden, buttons never overlap arrows */}
            <div
              ref={scrollRef}
              className="flex items-center gap-2 px-3 py-2 overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {REPORT_DEFINITIONS.map(def => (
                <button
                  key={def.key}
                  id={`report-btn-${def.key}`}
                  onClick={() => setSelectedReport(def.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 whitespace-nowrap shrink-0 ${
                    selectedReport === def.key
                      ? 'bg-[#0C005F] text-white border-[#0C005F] shadow-sm'
                      : 'bg-white text-foreground border-slate-200 hover:border-[#0C005F]/40 hover:text-[#0C005F] hover:bg-[#0C005F]/5'
                  }`}
                >
                  {def.label}
                </button>
              ))}
            </div>

            {/* Right scroll button */}
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
              className="flex items-center justify-center px-2 shrink-0 text-slate-400 hover:text-[#0C005F] hover:bg-slate-50 border-l border-slate-200 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Section 3 — Month, Year, Export (25%) */}
          <div className="flex items-center justify-end gap-2 px-3 py-2" style={{ width: '25%', minWidth: 0, flexShrink: 0 }}>
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0C005F] cursor-pointer min-w-0 flex-1"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              id="report-year-select"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0C005F] cursor-pointer w-16 shrink-0"
            >
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {selectedYear === CURRENT_YEAR && (
              <Button
                id="recompute-benefits-btn"
                variant="outline"
                size="icon"
                onClick={handleRecompute}
                disabled={isLoading || isRecomputing}
                className="h-8 w-8 shrink-0 hover:text-[#0C005F] hover:bg-[#0C005F]/5 border-slate-200"
                title="Recompute eligibility records in database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecomputing ? 'animate-spin text-[#0C005F]' : 'text-slate-500 hover:text-[#0C005F]'}`} />
              </Button>
            )}
            <Button
              id="export-pdf-btn"
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="gap-1.5 bg-[#0C005F] hover:bg-[#0C005F]/90 text-white h-8 text-xs font-medium shadow-sm shrink-0 px-3"
            >
              {isExporting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />
              }
              {isExporting ? 'Exporting…' : 'Export to PDF'}
            </Button>
          </div>

        </div>
      </div>

      {/* ── Active Report Card ── */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {selectedReport === 'full'
                ? 'Full Report — All Reports'
                : activeDefinition?.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{reportMonthLabel}</span>
              {selectedReport !== 'full' && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {isLoading ? '…' : `${activeData.length} employee${activeData.length !== 1 ? 's' : ''}`}
                </span>
              )}
              {lastComputedDate && selectedReport !== 'masterlist' && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                  Last computed: {lastComputedDate}
                </span>
              )}
            </p>
          </div>

          {/* Search bar */}
          {!isLoading && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="report-search-input"
                placeholder="Search name, ID, department…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className={`flex-1 min-h-0 ${selectedReport === 'full' ? 'overflow-y-auto' : 'flex flex-col'}`}>
          {!isLoading && !hasDataForYear && selectedReport !== 'masterlist' && (
            <div className="mx-4 mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-amber-800">No Eligibility Records for {selectedYear}</p>
                <p className="text-amber-700/95 mt-1">
                  There are no eligibility records computed in the database for the year {selectedYear}. 
                  {selectedYear === CURRENT_YEAR ? (
                    <span> Please click the <strong>Recompute</strong> button in the top bar to evaluate benefit eligibility for this year.</span>
                  ) : (
                    <span> Benefit eligibility is only computed and stored for the current year. Historical data is not available.</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full py-24 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading employee data…</span>
            </div>
          ) : selectedReport === 'full' ? (
            <div className="p-4">
              <FullReportView
                allReportData={allReportData}
                searchQuery={searchQuery}
                reportMonthLabel={reportMonthLabel}
              />
            </div>
          ) : (
            <ReportTable
              def={activeDefinition}
              data={activeData}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
}