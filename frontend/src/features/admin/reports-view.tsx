'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { getReportData } from '@/services/admin';
import { ClinicReportData } from '@/types/admin';
import { useToast } from '@/components/ui/toast';
import { 
  Calendar, 
  Download, 
  FileText, 
  Table2, 
  FileSpreadsheet, 
  RefreshCw, 
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default function ReportsView() {
  const [reportData, setReportData] = useState<ClinicReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Range (default: last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [activeReportTab, setActiveReportTab] = useState<'revenue' | 'patients' | 'doctors' | 'payments'>('revenue');

  const { toast } = useToast();

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await getReportData({ start: startDate, end: endDate });
      setReportData(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to compile clinic data reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  // Export CSV
  const exportCSV = (data: any[], filename: string, headers: string[], rowMapper: (row: any) => string[]) => {
    try {
      const csvContent = [
        headers.join(','),
        ...data.map(row => rowMapper(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast(`Exported ${filename}.csv successfully!`, 'success');
    } catch (err) {
      console.error(err);
      toast('CSV Export failed', 'error');
    }
  };

  // Export Excel
  const exportExcel = (data: any[], filename: string, headers: string[], rowMapper: (row: any) => string[]) => {
    try {
      // Simulating simple HTML format representing Excel to support formatting
      const headerRow = headers.map(h => `<th style="background-color: #1E40AF; color: white; padding: 8px; border: 1px solid #ddd;">${h}</th>`).join('');
      const bodyRows = data.map(row => {
        const cols = rowMapper(row).map(val => `<td style="padding: 8px; border: 1px solid #ddd;">${val}</td>`).join('');
        return `<tr>${cols}</tr>`;
      }).join('');

      const tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8" /></head>
        <body>
          <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast(`Exported ${filename}.xls successfully!`, 'success');
    } catch (err) {
      console.error(err);
      toast('Excel Export failed', 'error');
    }
  };

  // Export PDF
  const exportPDF = (title: string, headers: string[], rows: string[][]) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast('Popup blocked! Please allow popups to export PDF.', 'error');
        return;
      }

      const tableHeaders = headers.map(h => `<th style="padding: 10px; border-bottom: 2px solid #333; text-align: left; font-size: 11px;">${h}</th>`).join('');
      const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px;">${c}</td>`).join('')}</tr>`).join('');

      printWindow.document.write(`
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1E40AF; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #111; }
            .meta { font-size: 10px; color: #666; text-align: right; }
            table { w-full: 100%; width: 100%; border-collapse: collapse; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${title}</div>
              <div style="font-size: 12px; margin-top: 5px; color: #555;">MedflowX Clinic Control Center</div>
            </div>
            <div class="meta">
              Date: ${new Date().toLocaleDateString()}<br>
              Range: ${startDate} to ${endDate}
            </div>
          </div>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">
            MedflowX Hospital Information Ledger Management System • Confidential Administration Copy
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      toast('PDF printable sheet compiled successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('PDF Generation failed', 'error');
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) return;

    if (activeReportTab === 'revenue') {
      const headers = ['Report Date', 'Collected Revenue (₹)', 'Receipt Transactions Count'];
      const data = reportData.dailyRevenue;
      const mapper = (r: any) => [r.date, `₹${r.amount}`, String(r.count)];
      const title = 'MedflowX Clinic Daily Revenue Statement';
      
      if (format === 'csv') exportCSV(data, 'daily_revenue_report', headers, mapper);
      if (format === 'excel') exportExcel(data, 'daily_revenue_report', headers, mapper);
      if (format === 'pdf') exportPDF(title, headers, data.map(mapper));
    } else if (activeReportTab === 'patients') {
      const headers = ['Enrollment Date', 'Patients Count Registered'];
      const data = reportData.patientCount;
      const mapper = (r: any) => [r.date, String(r.count)];
      const title = 'MedflowX Clinic Patient Registrations Summary';

      if (format === 'csv') exportCSV(data, 'patient_registrations_report', headers, mapper);
      if (format === 'excel') exportExcel(data, 'patient_registrations_report', headers, mapper);
      if (format === 'pdf') exportPDF(title, headers, data.map(mapper));
    } else if (activeReportTab === 'doctors') {
      const headers = ['Doctor Name', 'Department Specialized', 'Completed Visits Logged', 'Consultation Revenue Gen (₹)'];
      const data = reportData.doctorVisits;
      const mapper = (r: any) => [r.doctorName, r.departmentName, String(r.visitCount), `₹${r.revenue}`];
      const title = 'MedflowX Clinic Doctor Consultation Performances';

      if (format === 'csv') exportCSV(data, 'doctor_performance_report', headers, mapper);
      if (format === 'excel') exportExcel(data, 'doctor_performance_report', headers, mapper);
      if (format === 'pdf') exportPDF(title, headers, data.map(mapper));
    } else if (activeReportTab === 'payments') {
      const headers = ['Payment Mode Ledger', 'Receipt Count', 'Total Fees Collected (₹)'];
      const data = reportData.paymentSummary;
      const mapper = (r: any) => [r.method, String(r.count), `₹${r.amount}`];
      const title = 'MedflowX Clinic Payment Breakdown Analytics';

      if (format === 'csv') exportCSV(data, 'payment_methods_report', headers, mapper);
      if (format === 'excel') exportExcel(data, 'payment_methods_report', headers, mapper);
      if (format === 'pdf') exportPDF(title, headers, data.map(mapper));
    }
  };

  // Pure CSS visual charts rendering
  const renderRevenueChart = () => {
    if (!reportData || reportData.dailyRevenue.length === 0) return null;
    const maxVal = Math.max(...reportData.dailyRevenue.map(d => d.amount), 500);

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-heading">Revenue Trend Visual (Last 30 Days)</h4>
        <div className="h-48 flex items-end gap-3 border-b border-zinc-150 pb-2 pt-6">
          {reportData.dailyRevenue.map((d, i) => {
            const pct = (d.amount / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-6 scale-0 group-hover:scale-100 transition-all bg-zinc-800 text-white rounded text-[9px] px-1.5 py-0.5 whitespace-nowrap shadow-md z-10 font-bold">
                  ₹{d.amount} ({d.count} tx)
                </div>
                {/* Column */}
                <div 
                  style={{ height: `${Math.max(pct, 5)}%` }} 
                  className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer shadow-inner animate-pulse"
                />
                <span className="text-[9px] text-zinc-400 font-semibold mt-1.5 truncate max-w-[40px] font-mono">
                  {d.date.split('/')[0]}/{d.date.split('/')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Analytics & Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">Compile comprehensive audit files and exports matching clinic operational diagnostics.</p>
        </div>

        {/* Date Selector */}
        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs shrink-0 self-start sm:self-auto">
          <CardContent className="p-3 flex items-center gap-3">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 focus:ring-0 focus:outline-none text-zinc-650 font-semibold p-0.5 w-[110px] cursor-pointer"
              />
              <span className="text-zinc-300 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 focus:ring-0 focus:outline-none text-zinc-650 font-semibold p-0.5 w-[110px] cursor-pointer"
              />
            </div>
            <button
              onClick={loadReport}
              className="p-1 border border-zinc-100 hover:bg-zinc-50 rounded text-zinc-500 hover:text-primary transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Reports Directory Menu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveReportTab('revenue')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer ${
            activeReportTab === 'revenue'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-white border-zinc-150/60 hover:bg-zinc-50/50'
          }`}
        >
          <div className={`p-1.5 rounded-lg inline-block self-start ${activeReportTab === 'revenue' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-heading">Revenue Records</h4>
            <span className="text-sm font-bold block mt-1">Daily / Monthly Fees</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReportTab('patients')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer ${
            activeReportTab === 'patients'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-white border-zinc-150/60 hover:bg-zinc-50/50'
          }`}
        >
          <div className={`p-1.5 rounded-lg inline-block self-start ${activeReportTab === 'patients' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-heading">Enrollment Log</h4>
            <span className="text-sm font-bold block mt-1">Patient Registrations</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReportTab('doctors')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer ${
            activeReportTab === 'doctors'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-white border-zinc-150/60 hover:bg-zinc-50/50'
          }`}
        >
          <div className={`p-1.5 rounded-lg inline-block self-start ${activeReportTab === 'doctors' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-heading">Practitioner performances</h4>
            <span className="text-sm font-bold block mt-1">Doctor-wise Consults</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReportTab('payments')}
          className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer ${
            activeReportTab === 'payments'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-white border-zinc-150/60 hover:bg-zinc-50/50'
          }`}
        >
          <div className={`p-1.5 rounded-lg inline-block self-start ${activeReportTab === 'payments' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-heading">Channel Breakdowns</h4>
            <span className="text-sm font-bold block mt-1">Payment Summaries</span>
          </div>
        </button>
      </div>

      {/* Main Reports Panel */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Table Content */}
        <Card className="md:col-span-2 border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Header Controls */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider font-heading">
                {activeReportTab === 'revenue' && 'Daily Revenue Ledger'}
                {activeReportTab === 'patients' && 'Patient Enrollments Registry'}
                {activeReportTab === 'doctors' && 'Doctor Consultations Ledger'}
                {activeReportTab === 'payments' && 'Payment mode breakdown metrics'}
              </h3>

              {/* Exporters */}
              <div className="inline-flex items-center gap-1.5">
                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/35 text-zinc-600 font-bold text-[10px] uppercase shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="h-3 w-3" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/35 text-zinc-600 font-bold text-[10px] uppercase shadow-xs transition-colors cursor-pointer"
                >
                  <Table2 className="h-3 w-3" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/35 text-zinc-600 font-bold text-[10px] uppercase shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
              </div>
            </div>

            {/* Table Grid */}
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
                <span className="text-sm text-zinc-400">Compiling ledger files...</span>
              </div>
            ) : !reportData ? (
              <div className="p-12 text-center text-xs text-zinc-400 italic">No operational data matches current dates.</div>
            ) : (
              <div>
                {/* 1. Revenue Table */}
                {activeReportTab === 'revenue' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Statement Date</TableHead>
                        <TableHead>Collected Revenue</TableHead>
                        <TableHead>Transactions Count</TableHead>
                        <TableHead className="text-right">Average Ticket</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dailyRevenue.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center italic py-8">No billing records found.</TableCell></TableRow>
                      ) : (
                        reportData.dailyRevenue.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150">
                            <TableCell className="font-semibold text-zinc-900">{row.date}</TableCell>
                            <TableCell className="font-bold text-emerald-650">₹{row.amount}</TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-zinc-500">{row.count} txs</TableCell>
                            <TableCell className="text-right text-xs font-medium">₹{row.count > 0 ? Math.round(row.amount / row.count) : 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* 2. Patients Table */}
                {activeReportTab === 'patients' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enrollment Date</TableHead>
                        <TableHead>Registered Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.patientCount.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center italic py-8">No registration records found.</TableCell></TableRow>
                      ) : (
                        reportData.patientCount.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150">
                            <TableCell className="font-semibold text-zinc-900">{row.date}</TableCell>
                            <TableCell className="font-mono font-bold text-zinc-800">{row.count} patients</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* 3. Doctors Table */}
                {activeReportTab === 'doctors' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor Name</TableHead>
                        <TableHead>Specialized Department</TableHead>
                        <TableHead>Consultations Count</TableHead>
                        <TableHead className="text-right">Fees Generated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.doctorVisits.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center italic py-8">No doctor visits recorded.</TableCell></TableRow>
                      ) : (
                        reportData.doctorVisits.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150">
                            <TableCell className="font-semibold text-zinc-900">{row.doctorName}</TableCell>
                            <TableCell className="text-xs font-semibold text-zinc-500">{row.departmentName}</TableCell>
                            <TableCell className="font-mono text-xs font-bold text-zinc-800">{row.visitCount} visits</TableCell>
                            <TableCell className="text-right font-bold text-emerald-650">₹{row.revenue}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* 4. Payments Table */}
                {activeReportTab === 'payments' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Audited Txs Count</TableHead>
                        <TableHead className="text-right">Total Collected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.paymentSummary.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center italic py-8">No payment summaries recorded.</TableCell></TableRow>
                      ) : (
                        reportData.paymentSummary.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150">
                            <TableCell className="font-semibold text-zinc-900">{row.method}</TableCell>
                            <TableCell className="font-mono text-xs text-zinc-500">{row.count} txs</TableCell>
                            <TableCell className="text-right font-bold text-emerald-650">₹{row.amount}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* CSS Chart widgets */}
        <div className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 font-heading">
                Operational Highlights
              </h3>
              
              {isLoading ? (
                <div className="h-40 bg-zinc-50 rounded-lg animate-pulse" />
              ) : activeReportTab === 'revenue' ? (
                renderRevenueChart()
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-150">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block mb-1 font-heading">Clinic Performance</span>
                    <p className="text-xs text-zinc-650 leading-relaxed font-semibold">
                      This report displays structured audits compiled between {startDate} and {endDate}. Generates download exports using standard formats.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                    <h5 className="text-xs font-bold text-primary font-heading">Operational Tip</h5>
                    <p className="text-[11px] text-zinc-650 mt-1">
                      Check doctor performance tables regularly to ensure clinic department consulting loads are evenly distributed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
