import React, { useState, useMemo, useCallback } from 'react';
import type { Invoice } from '../types';
import {
  checkCompliance,
  getOverallComplianceStats,
  suggestFixes,
  exportComplianceReport,
  exportComplianceReportJSON,
} from '../services/complianceTracker';
import type { ComplianceIssue, ComplianceCategory } from '../services/complianceTracker';

interface ComplianceDashboardProps {
  invoices?: Invoice[];
  invoice?: Invoice;
  onClose?: () => void;
  onFixIssue?: (invoiceNumber: string, issue: ComplianceIssue) => void;
}

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  TIN: 'bg-teal-500',
  CAC: 'bg-emerald-500',
  VAT: 'bg-blue-500',
  WHT: 'bg-amber-500',
  LineItems: 'bg-purple-500',
  Totals: 'bg-pink-500',
  Dates: 'bg-cyan-500',
  General: 'bg-slate-500',
};

const CATEGORY_ICONS: Record<ComplianceCategory, string> = {
  TIN: 'T',
  CAC: 'C',
  VAT: 'V',
  WHT: 'W',
  LineItems: 'L',
  Totals: 'S',
  Dates: 'D',
  General: 'G',
};

const numberFormatter = new Intl.NumberFormat();

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  invoices = [], invoice, onClose,
  onFixIssue,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ComplianceCategory | 'All'>('All');
  const [showFixPanel, setShowFixPanel] = useState<ComplianceIssue | null>(null);

  const targetInvoices = useMemo(() => {
    if (invoice) return [invoice];
    return invoices;
  }, [invoice, invoices]);

  const stats = useMemo(() => getOverallComplianceStats(targetInvoices), [targetInvoices]);

  const invoiceResults = useMemo(() => {
    return targetInvoices.map((inv) => ({
      invoice: inv,
      result: checkCompliance(inv),
    }));
  }, [targetInvoices]);

  const allIssues = useMemo(() => {
    const issues: (ComplianceIssue & { invoiceNumber: string })[] = [];
    for (const { invoice, result } of invoiceResults) {
      for (const issue of result.issues) {
        issues.push({ ...issue, invoiceNumber: invoice.invoiceNumber });
      }
    }
    return issues;
  }, [invoiceResults]);

  const filteredIssues = useMemo(() => {
    if (filterCategory === 'All') return allIssues;
    return allIssues.filter((issue) => issue.category === filterCategory);
  }, [allIssues, filterCategory]);

  const scoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  }, []);

  const scoreBg = useCallback((score: number) => {
    if (score >= 80) return 'bg-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  }, []);

  const handleExportCSV = () => {
    const report = exportComplianceReport(targetInvoices);
    const blob = new Blob([report], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const report = exportComplianceReportJSON(targetInvoices);
    const blob = new Blob([report], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_report_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryEntries = Object.entries(stats.categoryAverages) as [
    ComplianceCategory,
    number,
  ][];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                NRS Compliance Dashboard
              </h2>
              <p className="text-slate-400 text-sm">Track and fix compliance issues across all invoices</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</p>
              <p className={`text-3xl font-bold ${scoreColor(stats.averageScore)}`}>{stats.averageScore}%</p>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.averageScore >= 80 ? 'bg-emerald-400' : stats.averageScore >= 60 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${stats.averageScore}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Issues</p>
              <p className="text-3xl font-bold text-white">{stats.totalIssues}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">{allIssues.filter(i => i.severity === 'error').length} errors, {allIssues.filter(i => i.severity === 'warning').length} warnings</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compliant</p>
              <p className="text-3xl font-bold text-emerald-400">{stats.compliantCount}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">of {invoices.length} invoices</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Non-Compliant</p>
              <p className="text-3xl font-bold text-red-400">{stats.nonCompliantCount}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">need attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-4">Compliance by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryEntries.map(([category, score]) => (
            <div
              key={category}
              className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setFilterCategory(filterCategory === category ? 'All' : category)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded-md ${CATEGORY_COLORS[category]} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {CATEGORY_ICONS[category]}
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase">{category}</span>
              </div>
              <p className={`text-2xl font-bold ${scoreColor(score)}`}>{score}%</p>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[category]}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold">Recent Compliance Issues</h3>
          <div className="flex gap-2 flex-wrap">
            {(['All', 'TIN', 'CAC', 'VAT', 'WHT', 'LineItems', 'Totals', 'Dates', 'General'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">No issues found</p>
            <p className="text-sm mt-1">All invoices are compliant in this category</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredIssues.slice(0, 20).map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border ${
                  issue.severity === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : issue.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-slate-500/10 border-slate-500/20'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        issue.severity === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : issue.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{issue.category}</span>
                      <span className="text-[10px] text-slate-600">#{issue.invoiceNumber}</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{issue.message}</p>
                    <p className="text-xs text-slate-400">{issue.field}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFixPanel(showFixPanel?.id === issue.id ? null : issue)}
                      className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Fix
                    </button>
                    {issue.autoFixable && onFixIssue && (
                      <button
                        onClick={() => onFixIssue(issue.invoiceNumber, issue)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-bold transition-all"
                      >
                        Auto-fix
                      </button>
                    )}
                  </div>
                </div>

                {showFixPanel?.id === issue.id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs font-bold text-slate-300 mb-2">Suggested Fixes:</p>
                    <ul className="space-y-1">
                      {suggestFixes(issue).map((fix, idx) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-teal-400 mt-0.5">•</span>
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Invoice Compliance Overview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedInvoice(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !selectedInvoice ? 'bg-teal-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedInvoice('compliant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedInvoice === 'compliant' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Compliant
            </button>
            <button
              onClick={() => setSelectedInvoice('non-compliant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedInvoice === 'non-compliant' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Non-Compliant
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {invoiceResults
            .filter(({ result }) => {
              if (!selectedInvoice) return true;
              if (selectedInvoice === 'compliant') return result.score >= 80;
              return result.score < 80;
            })
            .sort((a, b) => a.result.score - b.result.score)
            .map(({ invoice, result }) => (
              <div
                key={invoice.invoiceNumber}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className={`w-12 h-12 rounded-xl ${scoreBg(result.score)} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${scoreColor(result.score)}`}>{result.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">#{invoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-400 truncate">{invoice.client.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {numberFormatter.format(invoice.total || 0)} {invoice.currency}
                  </p>
                  <p className="text-xs text-slate-400">
                    {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  {Object.entries(result.categoryScores)
                    .filter(([, score]) => (score as number) < 100)
                    .slice(0, 4)
                    .map(([cat, score]) => (
                      <span
                        key={cat}
                        className={`w-6 h-6 rounded text-[8px] font-bold flex items-center justify-center ${
                          (score as number) >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                        title={`${cat}: ${score}%`}
                      >
                        {CATEGORY_ICONS[cat as ComplianceCategory]}
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
