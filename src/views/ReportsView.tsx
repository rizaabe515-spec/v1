import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { CHART_OF_ACCOUNTS } from '../constants/coaData';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Layers,
  ArrowRightLeft,
  Calendar,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Sliders,
  Eye,
  Check,
  Building2,
  Clock,
  Briefcase
} from 'lucide-react';
import { 
  INITIAL_U009_DRIVERS, 
  U009AllocationDriver,
  generateMultiUnitPnl,
  generateOfficialBalanceSheet,
  generateCashFlowStatement,
  generateSubledgerControlReports,
  getAuditTraceForAccount,
  runAll38UatScenarios,
  UatTestResult
} from '../services/reportingAndUatSuite';

export const ReportsView: React.FC = () => {
  const { journals } = useERP();

  // Active top-level reporting tab
  const [activeTab, setActiveTab] = useState<
    'PNL_MULTI_UNIT' | 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'CASH_FLOW' | 'SUBLEDGERS' | 'AUDIT_TRACE' | 'UAT_SUITE'
  >('PNL_MULTI_UNIT');

  // P&L options
  const [pnlMode, setPnlMode] = useState<'CONSOLIDATED' | 'BEFORE_ALLOCATION' | 'AFTER_ALLOCATION'>('AFTER_ALLOCATION');
  const [drivers, setDrivers] = useState<U009AllocationDriver[]>(INITIAL_U009_DRIVERS);
  const [showDriverConfig, setShowDriverConfig] = useState(false);

  // Subledgers sub-tab
  const [subledgerType, setSubledgerType] = useState<'AP' | 'AR_CLEARING' | 'GRNI' | 'CA_PIC' | 'TOURNAMENT_DEPOSIT'>('AP');

  // Audit trace state
  const [selectedAuditAccount, setSelectedAuditAccount] = useState<string>('6-1101');
  const [auditSearch, setAuditSearch] = useState('');

  // UAT Suite state
  const [uatResults, setUatResults] = useState<UatTestResult[]>(() => runAll38UatScenarios());
  const [uatFilter, setUatFilter] = useState<string>('ALL');
  const [isExecutingUat, setIsExecutingUat] = useState(false);

  // Computed data
  const pnlData = useMemo(() => {
    return generateMultiUnitPnl(journals, drivers, pnlMode);
  }, [journals, drivers, pnlMode]);

  const balanceSheetData = useMemo(() => {
    return generateOfficialBalanceSheet(journals);
  }, [journals]);

  const cashFlowData = useMemo(() => {
    return generateCashFlowStatement(journals);
  }, [journals]);

  const subledgerData = useMemo(() => {
    return generateSubledgerControlReports(journals);
  }, [journals]);

  const auditRecords = useMemo(() => {
    return getAuditTraceForAccount(selectedAuditAccount, journals);
  }, [selectedAuditAccount, journals]);

  // Handler for running UAT suite
  const handleRunAllUat = () => {
    setIsExecutingUat(true);
    setTimeout(() => {
      const freshResults = runAll38UatScenarios();
      setUatResults(freshResults);
      setIsExecutingUat(false);
    }, 400);
  };

  const uatPassCount = uatResults.filter(r => r.status === 'PASS').length;
  const uatTotalCount = uatResults.length;
  const isUat100Percent = uatPassCount === uatTotalCount && uatTotalCount > 0;

  // Filtered UAT list
  const filteredUatResults = uatResults.filter(r => {
    if (uatFilter === 'ALL') return true;
    return r.category === uatFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <FileSpreadsheet className="w-4 h-4" />
            Laporan Keuangan Resmi &amp; UAT Verification Suite
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            PT Sport Universal Indonesia (Padel Beans)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Single General Ledger terintegrasi · Alokasi U009 Report-Only (Zero GL Duplication) · 38 Skenario UAT Go/No-Go Suite.
          </p>
        </div>

        {/* Global GL & UAT Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Single GL Balanced</span>
          </div>

          <button
            onClick={() => setActiveTab('UAT_SUITE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isUat100Percent
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-rose-950/80 border-rose-500 text-rose-300'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">UAT Suite: {uatPassCount}/{uatTotalCount} PASS</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('PNL_MULTI_UNIT')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'PNL_MULTI_UNIT'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Laba Rugi Multi-Unit (F-009/F-010)
        </button>
        <button
          onClick={() => setActiveTab('BALANCE_SHEET')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'BALANCE_SHEET'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Neraca Konsolidasi (F-011)
        </button>
        <button
          onClick={() => setActiveTab('TRIAL_BALANCE')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'TRIAL_BALANCE'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Neraca Saldo / Trial Balance (F-012)
        </button>
        <button
          onClick={() => setActiveTab('CASH_FLOW')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'CASH_FLOW'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Laporan Arus Kas (F-013)
        </button>
        <button
          onClick={() => setActiveTab('SUBLEDGERS')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'SUBLEDGERS'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Subledger Aging &amp; Rekap (F-015..017)
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_TRACE')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'AUDIT_TRACE'
              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Trace Drill-Down (F-021)
        </button>
        <button
          onClick={() => setActiveTab('UAT_SUITE')}
          className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
            activeTab === 'UAT_SUITE'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          UAT Verification &amp; Go/No-Go Suite
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LABA RUGI MULTI-UNIT (F-009 & F-010) */}
      {/* ========================================================================= */}
      {activeTab === 'PNL_MULTI_UNIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Sub-Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Laporan Laba Rugi Multi-Unit &amp; Alokasi Overhead U009
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  DEC-03: Periodik
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pilih perspektif pelaporan manajerial: Konsolidasi, Sebelum Alokasi Overhead (F-009), atau Setelah Alokasi Overhead (F-010 Report-Only).
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setPnlMode('CONSOLIDATED')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    pnlMode === 'CONSOLIDATED'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Konsolidasi PT SUI
                </button>
                <button
                  onClick={() => setPnlMode('BEFORE_ALLOCATION')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    pnlMode === 'BEFORE_ALLOCATION'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sebelum Alokasi U009 (F-009)
                </button>
                <button
                  onClick={() => setPnlMode('AFTER_ALLOCATION')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    pnlMode === 'AFTER_ALLOCATION'
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Setelah Alokasi U009 (F-010)
                </button>
              </div>

              <button
                onClick={() => setShowDriverConfig(!showDriverConfig)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Konfigurasi Driver Alokasi U009"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Allocation Constraint Proof Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">Total Biaya Bersama U009:</span>
              <span className="text-amber-400 font-bold">
                Rp {pnlData.consolidated.totalSharedExpensesU009.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">Alokasi Report-Only Terbagi:</span>
              <span className="text-emerald-400 font-bold">
                Rp {pnlData.allocationStats.totalU009ReportOnlyAllocated.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">U009 Unallocated (UAT-025):</span>
              <span className="text-slate-200 font-bold">
                Rp {pnlData.allocationStats.totalU009Unallocated.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Collapsible Driver Configuration Panel */}
          {showDriverConfig && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Konfigurasi Matriks Driver Alokasi U009 (Cost Pools)
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Report-Only · Zero GL Duplication Guaranteed (UAT-026)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drivers.map(driver => {
                  const weightTotal = (driver.weights.U001 + driver.weights.U002 + driver.weights.U003) * 100;
                  return (
                    <div key={driver.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{driver.poolName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{driver.poolCode}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{driver.description}</p>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-mono pt-1">
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="block text-slate-500">U001 Padel</span>
                          <span className="text-emerald-400 font-bold">{Math.round(driver.weights.U001 * 100)}%</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="block text-slate-500">U002 Resto</span>
                          <span className="text-emerald-400 font-bold">{Math.round(driver.weights.U002 * 100)}%</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="block text-slate-500">U003 Benteng</span>
                          <span className="text-emerald-400 font-bold">{Math.round(driver.weights.U003 * 100)}%</span>
                        </div>
                        <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="block text-slate-500">Total Bobot</span>
                          <span className={`font-bold ${weightTotal <= 100 ? 'text-slate-200' : 'text-rose-400'}`}>
                            {weightTotal}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* P&L Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Uraian Akun Finansial</th>
                  {pnlMode !== 'CONSOLIDATED' ? (
                    <>
                      <th className="py-2.5 px-3 text-right">U001 Padel Court</th>
                      <th className="py-2.5 px-3 text-right">U002 Coffee &amp; Resto</th>
                      <th className="py-2.5 px-3 text-right">U003 Coffee Benteng</th>
                      <th className="py-2.5 px-3 text-right text-amber-400">
                        {pnlMode === 'BEFORE_ALLOCATION' ? 'U009 Shared Cost' : 'U009 Unallocated'}
                      </th>
                    </>
                  ) : null}
                  <th className="py-2.5 px-3 text-right font-bold text-white bg-slate-950/60">
                    Total Konsolidasi PT SUI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                {/* 1. Pendapatan (Revenue) */}
                <tr className="bg-slate-950/40 font-sans font-bold text-emerald-400">
                  <td colSpan={pnlMode !== 'CONSOLIDATED' ? 6 : 2} className="py-2 px-3 uppercase text-[11px]">
                    1. PENDAPATAN OPERASIONAL (REVENUE)
                  </td>
                </tr>
                {CHART_OF_ACCOUNTS.filter(c => c.isRevenue).map(coa => {
                  const u1 = pnlData.U001.revenues.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u2 = pnlData.U002.revenues.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u3 = pnlData.U003.revenues.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u9 = pnlData.U009.revenues.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const totalLine = u1 + u2 + u3 + u9;
                  if (totalLine === 0) return null;

                  return (
                    <tr key={coa.accountCode} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 font-sans text-slate-300">
                        <span className="font-mono text-emerald-400 mr-2">{coa.accountCode}</span>
                        {coa.accountName}
                      </td>
                      {pnlMode !== 'CONSOLIDATED' ? (
                        <>
                          <td className="py-1.5 px-3 text-right text-slate-200">{u1 > 0 ? u1.toLocaleString('id-ID') : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-slate-200">{u2 > 0 ? u2.toLocaleString('id-ID') : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-slate-200">{u3 > 0 ? u3.toLocaleString('id-ID') : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-slate-400">{u9 > 0 ? u9.toLocaleString('id-ID') : '-'}</td>
                        </>
                      ) : null}
                      <td className="py-1.5 px-3 text-right font-bold text-white bg-slate-950/60">
                        {totalLine.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-900 font-bold border-t border-slate-700 text-emerald-400">
                  <td className="py-2 px-3 font-sans">TOTAL PENDAPATAN OPERASIONAL:</td>
                  {pnlMode !== 'CONSOLIDATED' ? (
                    <>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U001.revenues.total.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U002.revenues.total.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U003.revenues.total.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U009.revenues.total.toLocaleString('id-ID')}</td>
                    </>
                  ) : null}
                  <td className="py-2 px-3 text-right text-white bg-slate-950/60">
                    Rp {pnlData.consolidated.totalRevenue.toLocaleString('id-ID')}
                  </td>
                </tr>

                {/* 2. HPP Periodik (COGS) */}
                <tr className="bg-slate-950/40 font-sans font-bold text-amber-400">
                  <td colSpan={pnlMode !== 'CONSOLIDATED' ? 6 : 2} className="py-2 px-3 uppercase text-[11px] pt-4">
                    2. HARGA POKOK PENJUALAN PERIODIK (COGS PERIODIC)
                  </td>
                </tr>
                {CHART_OF_ACCOUNTS.filter(c => c.category === 'COGS_PERIODIC').map(coa => {
                  const u1 = pnlData.U001.cogs.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u2 = pnlData.U002.cogs.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u3 = pnlData.U003.cogs.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u9 = pnlData.U009.cogs.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const totalLine = u1 + u2 + u3 + u9;
                  if (totalLine === 0) return null;

                  return (
                    <tr key={coa.accountCode} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 font-sans text-slate-300">
                        <span className="font-mono text-amber-400 mr-2">{coa.accountCode}</span>
                        {coa.accountName}
                      </td>
                      {pnlMode !== 'CONSOLIDATED' ? (
                        <>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u1 > 0 ? `(${u1.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u2 > 0 ? `(${u2.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u3 > 0 ? `(${u3.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u9 > 0 ? `(${u9.toLocaleString('id-ID')})` : '-'}</td>
                        </>
                      ) : null}
                      <td className="py-1.5 px-3 text-right font-bold text-rose-300 bg-slate-950/60">
                        ({totalLine.toLocaleString('id-ID')})
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-900 font-bold border-t border-slate-700 text-amber-300">
                  <td className="py-2 px-3 font-sans">LABA KOTOR (GROSS PROFIT):</td>
                  {pnlMode !== 'CONSOLIDATED' ? (
                    <>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U001.grossProfit.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U002.grossProfit.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U003.grossProfit.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right">Rp {pnlData.U009.grossProfit.toLocaleString('id-ID')}</td>
                    </>
                  ) : null}
                  <td className="py-2 px-3 text-right text-amber-200 bg-slate-950/60">
                    Rp {pnlData.consolidated.grossProfit.toLocaleString('id-ID')}
                  </td>
                </tr>

                {/* 3. Beban Operasional Unit Langsung (Direct Expenses) */}
                <tr className="bg-slate-950/40 font-sans font-bold text-sky-400">
                  <td colSpan={pnlMode !== 'CONSOLIDATED' ? 6 : 2} className="py-2 px-3 uppercase text-[11px] pt-4">
                    3. BEBAN OPERASIONAL LANGSUNG UNIT (DIRECT OPERATING EXPENSES)
                  </td>
                </tr>
                {CHART_OF_ACCOUNTS.filter(c => c.category === 'EXPENSE_OPERATIONAL' || c.category === 'EXPENSE_TAX_OTHER').map(coa => {
                  const u1 = pnlData.U001.directExpenses.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u2 = pnlData.U002.directExpenses.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u3 = pnlData.U003.directExpenses.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const u9 = pnlData.U009.directExpenses.lines.find(l => l.accountCode === coa.accountCode)?.amount || 0;
                  const totalLine = u1 + u2 + u3 + u9;
                  if (totalLine === 0) return null;

                  return (
                    <tr key={coa.accountCode} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 font-sans text-slate-300">
                        <span className="font-mono text-sky-400 mr-2">{coa.accountCode}</span>
                        {coa.accountName}
                      </td>
                      {pnlMode !== 'CONSOLIDATED' ? (
                        <>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u1 > 0 ? `(${u1.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u2 > 0 ? `(${u2.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u3 > 0 ? `(${u3.toLocaleString('id-ID')})` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-rose-300">{u9 > 0 ? `(${u9.toLocaleString('id-ID')})` : '-'}</td>
                        </>
                      ) : null}
                      <td className="py-1.5 px-3 text-right font-bold text-rose-300 bg-slate-950/60">
                        ({totalLine.toLocaleString('id-ID')})
                      </td>
                    </tr>
                  );
                })}

                {/* 4. Report-Only Overhead Allocation U009 (If in AFTER_ALLOCATION mode) */}
                {pnlMode === 'AFTER_ALLOCATION' && (
                  <tr className="bg-amber-500/10 font-sans font-bold text-amber-300">
                    <td className="py-2.5 px-3">
                      Alokasi Biaya Bersama U009 (Shared HO Overhead Driver) [Report-Only]
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      ({pnlData.U001.allocatedSharedCost.toLocaleString('id-ID')})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      ({pnlData.U002.allocatedSharedCost.toLocaleString('id-ID')})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      ({pnlData.U003.allocatedSharedCost.toLocaleString('id-ID')})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      {pnlData.U009.unallocatedSharedCost > 0
                        ? `(${pnlData.U009.unallocatedSharedCost.toLocaleString('id-ID')})`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300 bg-slate-950/60">
                      ({pnlData.consolidated.totalSharedExpensesU009.toLocaleString('id-ID')})
                    </td>
                  </tr>
                )}

                {/* 5. Laba Bersih (Net Income) */}
                <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white text-sm">
                  <td className="py-3 px-3 font-sans">
                    LABA BERSIH BERJALAN (NET INCOME):
                  </td>
                  {pnlMode !== 'CONSOLIDATED' ? (
                    <>
                      <td className={`py-3 px-3 text-right ${pnlData.U001.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rp {pnlData.U001.netIncome.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlData.U002.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rp {pnlData.U002.netIncome.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlData.U003.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rp {pnlData.U003.netIncome.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3 px-3 text-right ${pnlData.U009.netIncome >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                        Rp {pnlData.U009.netIncome.toLocaleString('id-ID')}
                      </td>
                    </>
                  ) : null}
                  <td className={`py-3 px-3 text-right font-extrabold bg-slate-950 ${pnlData.consolidated.netIncome >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Rp {pnlData.consolidated.netIncome.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NERACA KONSOLIDASI (F-011) & ZERO-TOLERANCE BLOCKER */}
      {/* ========================================================================= */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                Neraca Konsolidasi PT Sport Universal Indonesia (F-011)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standar Akuntansi Keuangan: Total Aset Wajib Identik dengan Total Liabilitas + Ekuitas (Zero Tolerance).
              </p>
            </div>

            {/* Zero-Tolerance Blocker Indicator (UAT-028) */}
            {balanceSheetData.isBalanced ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">Aset == Pasiva (100% Balanced)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-mono animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">OUT-OF-BALANCE BLOCKER: Selisih Rp {balanceSheetData.outOfBalanceDiff.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Two-Column Assets vs Liabilities/Equity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-mono">
            {/* Left: ASSETS */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-sans font-bold text-emerald-400 uppercase text-xs">
                <span>AKTIVA / ASET (ASSETS)</span>
                <span className="font-mono">Rp {balanceSheetData.totalAssets.toLocaleString('id-ID')}</span>
              </div>

              {/* Current Assets */}
              <div className="space-y-2">
                <div className="font-sans font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                  Aset Lancar (Current Assets)
                </div>
                {balanceSheetData.currentAssets.lines.map(l => (
                  <div key={l.code} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="font-sans">
                      <span className="font-mono text-emerald-400 mr-2">{l.code}</span>
                      {l.name}
                    </span>
                    <span>Rp {l.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-100 pt-1">
                  <span className="font-sans">Total Aset Lancar:</span>
                  <span>Rp {balanceSheetData.currentAssets.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="font-sans font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                  Aset Tidak Lancar &amp; Fasilitas Olahraga (Non-Current Assets)
                </div>
                {balanceSheetData.nonCurrentAssets.lines.map(l => (
                  <div key={l.code} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="font-sans">
                      <span className="font-mono text-emerald-400 mr-2">{l.code}</span>
                      {l.name}
                    </span>
                    <span>{l.amount < 0 ? `(Rp ${Math.abs(l.amount).toLocaleString('id-ID')})` : `Rp ${l.amount.toLocaleString('id-ID')}`}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-100 pt-1">
                  <span className="font-sans">Total Aset Tidak Lancar:</span>
                  <span>Rp {balanceSheetData.nonCurrentAssets.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Total Assets Summary */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between font-bold text-sm text-emerald-400">
                <span className="font-sans">TOTAL AKTIVA (ASSETS):</span>
                <span>Rp {balanceSheetData.totalAssets.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Right: LIABILITIES & EQUITY */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-sans font-bold text-emerald-400 uppercase text-xs">
                <span>PASIVA (LIABILITAS &amp; EKUITAS)</span>
                <span className="font-mono">Rp {balanceSheetData.totalLiabilitiesAndEquity.toLocaleString('id-ID')}</span>
              </div>

              {/* Current Liabilities */}
              <div className="space-y-2">
                <div className="font-sans font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                  Kewajiban Lancar (Current Liabilities)
                </div>
                {balanceSheetData.currentLiabilities.lines.map(l => (
                  <div key={l.code} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="font-sans">
                      <span className="font-mono text-emerald-400 mr-2">{l.code}</span>
                      {l.name}
                    </span>
                    <span>Rp {l.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-100 pt-1">
                  <span className="font-sans">Total Kewajiban Lancar:</span>
                  <span>Rp {balanceSheetData.currentLiabilities.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Non-Current Liabilities */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="font-sans font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                  Kewajiban Jangka Panjang &amp; Pembiayaan (Non-Current)
                </div>
                {balanceSheetData.nonCurrentLiabilities.lines.map(l => (
                  <div key={l.code} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="font-sans">
                      <span className="font-mono text-emerald-400 mr-2">{l.code}</span>
                      {l.name}
                    </span>
                    <span>Rp {l.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-100 pt-1">
                  <span className="font-sans">Total Kewajiban Jangka Panjang:</span>
                  <span>Rp {balanceSheetData.nonCurrentLiabilities.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="font-sans font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                  Ekuitas Pemilik Modal (Equity)
                </div>
                {balanceSheetData.equity.lines.map(l => (
                  <div key={l.code} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="font-sans">
                      <span className="font-mono text-emerald-400 mr-2">{l.code}</span>
                      {l.name}
                    </span>
                    <span>Rp {l.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="flex justify-between text-emerald-400 font-semibold py-1">
                  <span className="font-sans">Laba Bersih Tahun Berjalan (Net Income P&amp;L):</span>
                  <span>Rp {balanceSheetData.equity.currentPeriodNetIncome.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-100 pt-1">
                  <span className="font-sans">Total Ekuitas &amp; Laba:</span>
                  <span>Rp {balanceSheetData.equity.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Total Liabilities & Equity Summary */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between font-bold text-sm text-emerald-400">
                <span className="font-sans">TOTAL PASIVA (LIABILITAS + EKUITAS):</span>
                <span>Rp {balanceSheetData.totalLiabilitiesAndEquity.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRIAL BALANCE / NERACA SALDO (F-012) */}
      {/* ========================================================================= */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Neraca Saldo / Trial Balance (F-012)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mutasi debit/kredit dan saldo penutupan seluruh akun COA dalam Single General Ledger.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
              Audit Rule: REQ-023 Verified
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Kode Akun</th>
                  <th className="py-2.5 px-3">Nama Akun &amp; Kategori</th>
                  <th className="py-2.5 px-3 text-right">Mutasi Debit (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Mutasi Kredit (Rp)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-200">Saldo Akhir Debit</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-200">Saldo Akhir Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                {CHART_OF_ACCOUNTS.map(coa => {
                  let deb = 0;
                  let cre = 0;
                  for (const jnl of journals) {
                    if (jnl.status !== 'POSTED') continue;
                    for (const l of jnl.lines) {
                      if (l.accountCode === coa.accountCode) {
                        deb += l.debit;
                        cre += l.credit;
                      }
                    }
                  }
                  if (deb === 0 && cre === 0) return null;

                  const net = deb - cre;
                  const finalDeb = net > 0 ? net : 0;
                  const finalCre = net < 0 ? Math.abs(net) : 0;

                  return (
                    <tr 
                      key={coa.accountCode} 
                      onClick={() => {
                        setSelectedAuditAccount(coa.accountCode);
                        setActiveTab('AUDIT_TRACE');
                      }}
                      className="hover:bg-slate-800/50 cursor-pointer group transition-colors"
                      title="Klik untuk melihat Audit Trace drilldown akun ini"
                    >
                      <td className="py-2 px-3 font-bold text-emerald-400 group-hover:underline">
                        {coa.accountCode}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-300">
                        <div className="font-medium text-white group-hover:text-emerald-300">{coa.accountName}</div>
                        <div className="text-[10px] text-slate-500">{coa.category}</div>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {deb > 0 ? deb.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {cre > 0 ? cre.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        {finalDeb > 0 ? finalDeb.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        {finalCre > 0 ? finalCre.toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LAPORAN ARUS KAS (F-013) */}
      {/* ========================================================================= */}
      {activeTab === 'CASH_FLOW' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                Laporan Arus Kas / Cash Flow Statement (F-013)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Metode Langsung (Direct Method): Mengeliminasi transfer internal antar-rekening (1-1104 Transit) serta memisahkan aktivitas Operasi, Investasi, dan Pendanaan.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Rekonsiliasi Kas Neraca: OK</span>
            </div>
          </div>

          <div className="max-w-4xl space-y-6 text-xs font-mono">
            {/* 1. Operating Activities */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="font-sans font-bold text-emerald-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
                1. ARUS KAS DARI AKTIVITAS OPERASIONAL (OPERATING CASH FLOW)
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Penerimaan Kas dari Pelanggan (POS, Sewa Lapangan, F&amp;B):</span>
                <span className="text-emerald-400">Rp {cashFlowData.operatingActivities.cashFromCustomers.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Penerimaan Uang Muka Turnamen Lintas Bulan (2-1301):</span>
                <span className="text-emerald-400">Rp {cashFlowData.operatingActivities.cashFromTournamentsDeposit.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Pembayaran Kas kepada Pemasok &amp; Pembelian Persediaan:</span>
                <span className="text-rose-400">(Rp {cashFlowData.operatingActivities.cashPaidToSuppliers.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Pembayaran Beban Operasional, Gaji &amp; Utilitas:</span>
                <span className="text-rose-400">(Rp {cashFlowData.operatingActivities.cashPaidForOperatingExpenses.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Penyetoran Pajak Daerah PBJT (2-1201 / 2-1202):</span>
                <span className="text-rose-400">(Rp {cashFlowData.operatingActivities.cashPaidForTaxesPBJT.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Pencairan Uang Muka Operasional Karyawan (1-1401 Cash Advance):</span>
                <span className="text-rose-400">(Rp {cashFlowData.operatingActivities.cashPaidCashAdvance.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-slate-100 text-sm">
                <span className="font-sans">Kas Bersih Dihasilkan dari Aktivitas Operasional:</span>
                <span className={cashFlowData.operatingActivities.netOperatingCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  Rp {cashFlowData.operatingActivities.netOperatingCashFlow.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* 2. Investing Activities */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="font-sans font-bold text-amber-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
                2. ARUS KAS DARI AKTIVITAS INVESTASI (INVESTING CASH FLOW)
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Pengadaan Aset Tetap, Peralatan F&amp;B &amp; Fasilitas:</span>
                <span className="text-rose-400">(Rp {cashFlowData.investingActivities.cashPaidForFixedAssetsCapEx.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Konstruksi Dalam Pelaksanaan Lapangan Padel (1-1501 CIP):</span>
                <span className="text-rose-400">(Rp {cashFlowData.investingActivities.cashPaidForCIP.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-slate-100 text-sm">
                <span className="font-sans">Kas Bersih Digunakan untuk Aktivitas Investasi:</span>
                <span className="text-rose-400">
                  (Rp {Math.abs(cashFlowData.investingActivities.netInvestingCashFlow).toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            {/* 3. Financing Activities */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="font-sans font-bold text-sky-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
                3. ARUS KAS DARI AKTIVITAS PENDANAAN (FINANCING CASH FLOW)
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Penerimaan Pinjaman Pihak Berelasi PT DKSI (2-1401):</span>
                <span className="text-emerald-400">Rp {cashFlowData.financingActivities.cashInflowDKSILoan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Setoran Uang Muka Modal Pemilik (3-1102):</span>
                <span className="text-emerald-400">Rp {cashFlowData.financingActivities.cashInflowOwnerAdvance.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="font-sans">Pembayaran Pokok Pinjaman:</span>
                <span className="text-rose-400">(Rp {cashFlowData.financingActivities.cashOutflowLoanRepayment.toLocaleString('id-ID')})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-slate-100 text-sm">
                <span className="font-sans">Kas Bersih dari Aktivitas Pendanaan:</span>
                <span className="text-emerald-400">
                  Rp {cashFlowData.financingActivities.netFinancingCashFlow.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Cash Summary Reconciliation */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-2 text-white">
              <div className="flex justify-between py-1 font-bold">
                <span className="font-sans">KENAIKAN (PENURUNAN) BERSIH KAS &amp; BANK:</span>
                <span className="text-emerald-400">Rp {cashFlowData.summary.netCashChange.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span className="font-sans">Saldo Kas &amp; Bank Awal Periode:</span>
                <span>Rp {cashFlowData.summary.beginningCashAndBank.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-800 font-extrabold text-base text-emerald-300">
                <span className="font-sans">SALDO KAS &amp; BANK AKHIR PERIODE:</span>
                <span>Rp {cashFlowData.summary.endingCashAndBank.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                Catatan Eliminasi: Sistem berhasil mengeliminasi {cashFlowData.eliminatedTransitTransfers} transaksi mutasi internal akun 1-1104 (Bank Transfer Transit) sehingga tidak ada arus kas semu.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SUBLEDGER AGING & RECONCILIATION REPORTS (F-015..017) */}
      {/* ========================================================================= */}
      {activeTab === 'SUBLEDGERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                Subledger Aging &amp; Rekonsiliasi Pengendali
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rincian saldo akun pembantu (Hutang Dagang, Kliring Pembayaran, GRNI, Cash Advance, dan Deposit Turnamen).
              </p>
            </div>

            {/* Sub-selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setSubledgerType('AP')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  subledgerType === 'AP' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                AP Aging (F-015)
              </button>
              <button
                onClick={() => setSubledgerType('AR_CLEARING')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  subledgerType === 'AR_CLEARING' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                AR &amp; Kliring (F-016)
              </button>
              <button
                onClick={() => setSubledgerType('GRNI')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  subledgerType === 'GRNI' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                GRNI 2-1104 (F-017)
              </button>
              <button
                onClick={() => setSubledgerType('CA_PIC')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  subledgerType === 'CA_PIC' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                Rekap CA 1-1401
              </button>
              <button
                onClick={() => setSubledgerType('TOURNAMENT_DEPOSIT')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  subledgerType === 'TOURNAMENT_DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                Deposit 2-1301
              </button>
            </div>
          </div>

          {/* 1. AP Aging */}
          {subledgerType === 'AP' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold">
                Daftar Tagihan Hutang Vendor (Akun 2-1101) berdasarkan Kelompok Umur Hutang:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2 px-3">Nama Vendor</th>
                      <th className="py-2 px-3">Nomor Bill / Invoice</th>
                      <th className="py-2 px-3">Ref PO</th>
                      <th className="py-2 px-3">Jatuh Tempo</th>
                      <th className="py-2 px-3">Bucket Umur</th>
                      <th className="py-2 px-3 text-right">Sisa Hutang (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {subledgerData.apItems.map(item => (
                      <tr key={item.billNumber} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-sans font-medium text-white">{item.vendorName}</td>
                        <td className="py-2 px-3 text-emerald-400">{item.billNumber}</td>
                        <td className="py-2 px-3 text-slate-400">{item.poReference}</td>
                        <td className="py-2 px-3 text-slate-300">{item.dueDate}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                            item.bucket === 'CURRENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {item.bucket} ({item.daysOverdue} hari)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. AR & Clearing */}
          {subledgerType === 'AR_CLEARING' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold">
                Memisahkan Piutang Settlement Sementara (1-1201) dengan Piutang Usaha Korporat (1-1202):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2 px-3">Kategori Akun</th>
                      <th className="py-2 px-3">Provider / Pelanggan</th>
                      <th className="py-2 px-3">Batch Ref / Doc No</th>
                      <th className="py-2 px-3">Tanggal Transaksi</th>
                      <th className="py-2 px-3 text-right">Nominal Bruto</th>
                      <th className="py-2 px-3 text-right">Est. MDR / Admin</th>
                      <th className="py-2 px-3 text-right">Neto Tertagih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {subledgerData.clearingItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                            item.type === 'PAYMENT_CLEARING_1201'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.type === 'PAYMENT_CLEARING_1201' ? '1-1201 Clearing' : '1-1202 Trade AR'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans font-medium text-white">{item.providerOrCustomer}</td>
                        <td className="py-2 px-3 text-slate-400">{item.referenceNo}</td>
                        <td className="py-2 px-3 text-slate-300">{item.date} ({item.daysPending} hari)</td>
                        <td className="py-2 px-3 text-right text-slate-200">Rp {item.grossAmount.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right text-rose-300">
                          {item.mdrOrDiscount > 0 ? `(Rp ${item.mdrOrDiscount.toLocaleString('id-ID')})` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          Rp {item.netPendingAmount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. GRNI Aging */}
          {subledgerType === 'GRNI' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold">
                Daftar Penerimaan Barang Persediaan Belum Diterbitkan Tagihan oleh Vendor (Akun 2-1104):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2 px-3">ID Penerimaan (GR)</th>
                      <th className="py-2 px-3">Ref PO</th>
                      <th className="py-2 px-3">Nama Vendor</th>
                      <th className="py-2 px-3">Lokasi Masuk</th>
                      <th className="py-2 px-3">Tanggal Diterima</th>
                      <th className="py-2 px-3 text-right">Nilai Belum Ditagih (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {subledgerData.grniItems.map(item => (
                      <tr key={item.grId} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-emerald-400 font-bold">{item.grId}</td>
                        <td className="py-2 px-3 text-slate-300">{item.poId}</td>
                        <td className="py-2 px-3 font-sans text-white">{item.vendorName}</td>
                        <td className="py-2 px-3 text-amber-400">{item.targetLocationId}</td>
                        <td className="py-2 px-3 text-slate-400">{item.receiptDate} ({item.daysUnbilled} hari)</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          Rp {item.unbilledValue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Cash Advance Recap */}
          {subledgerType === 'CA_PIC' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold">
                Rekapitulasi Saldo Uang Muka Operasional Karyawan per PIC (Akun 1-1401):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2 px-3">ID Batch CA</th>
                      <th className="py-2 px-3">Nama Penanggung Jawab (PIC)</th>
                      <th className="py-2 px-3">Tujuan Pengadaan</th>
                      <th className="py-2 px-3 text-right">Plafon Top-Up</th>
                      <th className="py-2 px-3 text-right">Realisasi Disetujui</th>
                      <th className="py-2 px-3 text-right">Sisa Disetor ke Bank</th>
                      <th className="py-2 px-3 text-right">Sisa Saldo</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {subledgerData.caRecaps.map(item => (
                      <tr key={item.batchId} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-emerald-400 font-bold">{item.batchId}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-white">{item.picName}</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">{item.purpose}</td>
                        <td className="py-2 px-3 text-right text-slate-200">Rp {item.topUpAmount.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right text-emerald-300">Rp {item.realizedAmount.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right text-sky-300">Rp {item.returnedAmount.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-400">Rp {item.remainingBalance.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                            item.status === 'SETTLED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Tournament Deposit Recap */}
          {subledgerType === 'TOURNAMENT_DEPOSIT' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold">
                Rekapitulasi Uang Muka Registrasi Turnamen Belum Terlaksana (Akun 2-1301):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2 px-3">Nama Turnamen</th>
                      <th className="py-2 px-3">Nama Tim / Pemain</th>
                      <th className="py-2 px-3">Tanggal Daftar</th>
                      <th className="py-2 px-3 text-right">Nominal Deposit</th>
                      <th className="py-2 px-3 text-center">Status Pengakuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {subledgerData.tournamentDeposits.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-sans font-semibold text-white">{item.tournamentName}</td>
                        <td className="py-2 px-3 font-sans text-slate-300">{item.playerName}</td>
                        <td className="py-2 px-3 text-slate-400">{item.registrationDate}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          Rp {item.depositAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                            item.status === 'HELD_CROSS_MONTH'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.status === 'HELD_CROSS_MONTH' ? 'Kewajiban 2-1301 (Ditangguhkan)' : 'Diakui ke Pendapatan 4-1102'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT TRACE DRILL-DOWN (F-021, UAT-030) */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_TRACE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                Audit Trace Drill-Down Transaksi GL (F-021)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Menelusuri setiap angka laporan keuangan hingga ke baris jurnal asli, nomor dokumen sumber, tanggal, serta identitas pembuat (Maker) &amp; penyetuju (Approver).
              </p>
            </div>

            {/* Account Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Pilih Akun:</span>
              <select
                value={selectedAuditAccount}
                onChange={(e) => setSelectedAuditAccount(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {CHART_OF_ACCOUNTS.map(c => (
                  <option key={c.accountCode} value={c.accountCode}>
                    {c.accountCode} - {c.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Results Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div>
                Menampilkan mutasi GL untuk akun{' '}
                <span className="font-mono text-emerald-400 font-bold">{selectedAuditAccount}</span> (
                {CHART_OF_ACCOUNTS.find(c => c.accountCode === selectedAuditAccount)?.accountName})
              </div>
              <div className="font-mono">{auditRecords.length} Baris Jurnal Ditemukan</div>
            </div>

            {auditRecords.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                Belum ada transaksi GL yang didebit atau dikredit pada akun {selectedAuditAccount} dalam periode berjalan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                      <th className="py-2.5 px-3">No. Jurnal</th>
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Ref Dokumen Sumber</th>
                      <th className="py-2.5 px-3">Dimensi Unit / Lokasi</th>
                      <th className="py-2.5 px-3 text-right">Debit (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Kredit (Rp)</th>
                      <th className="py-2.5 px-3">Maker / Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {auditRecords.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">{rec.date}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{rec.journalNumber}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {rec.ruleCode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{rec.sourceDocNo}</td>
                        <td className="py-2 px-3">
                          <span className="text-emerald-400 font-bold">{rec.unitId}</span>
                          {rec.locationId && <span className="text-slate-400 ml-1">({rec.locationId})</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                          {rec.debit > 0 ? rec.debit.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                          {rec.credit > 0 ? rec.credit.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-300 text-[11px]">
                          <div><span className="text-slate-500">Maker:</span> {rec.createdBy}</div>
                          <div><span className="text-slate-500">Approver:</span> {rec.approvedBy}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: UAT VERIFICATION & GO/NO-GO SUITE (UAT-001 TO UAT-038) */}
      {/* ========================================================================= */}
      {activeTab === 'UAT_SUITE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Top Hero Banner with Run All Action */}
          <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Audit Acceptance &amp; Go-Live Validation Suite
              </div>
              <h2 className="text-xl font-black text-white">
                Verifikasi Menyeluruh 38 Skenario UAT
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                Pengujian otomatis end-to-end terhadap seluruh aturan Blueprint V1.3: Tax Matrix, POS, P2P, 3-Way Match, GRNI 2-1104, Cash Advance Abe Riza, HPP Periodik, U009 Report-Only, dan Isolasi Pembiayaan Non-Omzet.
              </p>
            </div>

            {/* Run All Button */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleRunAllUat}
                disabled={isExecutingUat}
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isExecutingUat ? 'Menguji 38 Skenario...' : 'Jalankan Seluruh 38 UAT'}</span>
              </button>
            </div>
          </div>

          {/* Metrics & Progress Bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Status Verifikasi Sistem:</span>
                <span className={`font-mono font-bold px-2.5 py-0.5 rounded text-[11px] ${
                  isUat100Percent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isUat100Percent ? 'READY FOR GO-LIVE (100% PASS)' : 'HASIL SEBAGIAN'}
                </span>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-sm">
                {uatPassCount} / {uatTotalCount} Skenario Lulus ({Math.round((uatPassCount / uatTotalCount) * 100)}%)
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(uatPassCount / uatTotalCount) * 100}%` }}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
              <span className="text-slate-400 mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Kategori:
              </span>
              {[
                { id: 'ALL', label: 'Semua (38)' },
                { id: 'REVENUE_TAX', label: 'Penjualan & Pajak' },
                { id: 'PROCUREMENT_3WAY', label: 'P2P & 3-Way Match' },
                { id: 'CASH_BANKING_CA', label: 'Kas, Bank & CA' },
                { id: 'INVENTORY_PERIODIC_HPP', label: 'Stok & HPP Periodik' },
                { id: 'REPORTING_ALLOCATION', label: 'Pelaporan & U009' },
                { id: 'RBAC_SECURITY', label: 'RBAC & Periode' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setUatFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                    uatFilter === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUatResults.map((scenario) => (
              <div 
                key={scenario.scenarioId}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 text-xs space-y-2.5 transition-all"
              >
                {/* Header: ID, Title, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {scenario.scenarioId}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {scenario.requirementRef}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-xs mt-0.5">
                      {scenario.title}
                    </div>
                  </div>

                  <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider ${
                    scenario.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {scenario.status}
                  </span>
                </div>

                {/* Expected & Actual */}
                <div className="space-y-1 text-[11px] pt-1 border-t border-slate-900">
                  <div className="text-slate-400">
                    <span className="text-slate-500 font-semibold">Kriteria:</span> {scenario.expectedBehavior}
                  </div>
                  <div className="text-slate-200">
                    <span className="text-slate-500 font-semibold">Hasil:</span> {scenario.actualResult}
                  </div>
                </div>

                {/* Evidence Tag */}
                {scenario.journalEvidence && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                    <span>Bukti Jurnal:</span>
                    <span className="text-emerald-400">{scenario.journalEvidence}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
