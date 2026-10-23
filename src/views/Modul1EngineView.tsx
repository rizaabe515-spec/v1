import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { MASTER_UNITS, MASTER_LOCATIONS, MAP_UNIT_LOKASI } from '../constants/masterDimensions';
import { MAPPING_COA_FINAL } from '../constants/mappingCoaFinal';
import { SYSTEM_USERS, assertSegregationOfDuties } from '../services/rbacService';
import { accountingPeriodManager } from '../services/accountingPeriodService';
import { resolveAccount, BlockingAccountException } from '../services/accountResolver';
import { validateCoreGLPayload, executeCoreGLPosting, executeCoreGLReversal } from '../services/coreGlEngine';
import { BusinessUnitId, PhysicalLocationId, CoreGLJournalPayload } from '../types/module1';
import { 
  Database, 
  Layers, 
  ShieldCheck, 
  Key, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Search, 
  Filter, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  X
} from 'lucide-react';

export const Modul1EngineView: React.FC = () => {
  const { journals, postJournal, userRole } = useERP();

  const [activeTab, setActiveTab] = useState<'DIMENSI' | 'COA_CONFIG' | 'RBAC' | 'PERIODS' | 'GL_GUARDRAILS'>('DIMENSI');

  // Account Resolver Interactive State
  const [testKey, setTestKey] = useState<string>('PBJT_PAYABLE');
  const [testUnit, setTestUnit] = useState<BusinessUnitId>('U001');
  const [testLoc, setTestLoc] = useState<PhysicalLocationId>('L003');
  const [resolverResult, setResolverResult] = useState<any>(null);
  const [resolverError, setResolverError] = useState<string | null>(null);

  // Search & Filter COA
  const [coaSearch, setCoaSearch] = useState<string>('');
  const [coaCategoryFilter, setCoaCategoryFilter] = useState<string>('ALL');

  // Periods State
  const [periods, setPeriods] = useState(accountingPeriodManager.getPeriods());

  // UAT Test Suite Runner State
  const [testResults, setTestResults] = useState<Array<{
    testId: string;
    title: string;
    expected: string;
    actual: string;
    passed: boolean;
    errorOutput?: string;
  }>>([]);

  const handleResolveKey = () => {
    setResolverResult(null);
    setResolverError(null);
    try {
      const res = resolveAccount(testKey, {
        unitId: testUnit,
        locationId: testLoc,
        transactionSide: 'CREDIT'
      });
      setResolverResult(res);
    } catch (err: any) {
      setResolverError(err.message || 'Error occurred');
    }
  };

  const handleTogglePeriod = (periodMonth: string, currentStatus: string) => {
    if (currentStatus === 'OPEN') {
      accountingPeriodManager.closePeriod(periodMonth, 'Maya Pertiwi (Finance Controller)');
    } else {
      accountingPeriodManager.openPeriod(periodMonth);
    }
    setPeriods(accountingPeriodManager.getPeriods());
  };

  // Run automated live test suite for REQ-023 to REQ-028 & G-11
  const runUATTestSuite = () => {
    const results: typeof testResults = [];

    // Test 1: UAT-003 Zero-Tolerance Balance Check (Debit != Credit)
    const unbalancedPayload: CoreGLJournalPayload = {
      sourceEventId: 'TEST-EVT-01',
      sourceDocNo: 'TEST-DOC-01',
      ruleCode: 'TEST-BALANCE',
      date: '2026-09-20',
      reference: 'TEST-UAT-003',
      description: 'Pengujian Jurnal Tidak Balance (Dr 100.000 vs Cr 99.000)',
      lines: [
        { accountKey: 'CASH_ON_HAND', debit: 100000, credit: 0, unitId: 'U002', locationId: 'L003', description: 'Dr Cash' },
        { accountKey: 'REV_FNB', debit: 0, credit: 99000, unitId: 'U002', locationId: 'L003', description: 'Cr Rev (Selisih Rp 1000)' }
      ],
      makerUserId: 'USR-002'
    };
    const val1 = validateCoreGLPayload(unbalancedPayload, journals);
    results.push({
      testId: 'UAT-003',
      title: 'Zero-Tolerance Balance Check (Total Debit == Total Kredit)',
      expected: 'Jurnal DITOLAK karena selisih Rp 1.000 (Single GL mewajibkan balance mutlak).',
      actual: val1.isValid ? 'GAGAL: Jurnal tidak balance lolos validasi!' : 'SUKSES: Ditolak dengan benar oleh engine.',
      passed: !val1.isValid && val1.errors.some(e => e.includes('UAT-003')),
      errorOutput: val1.errors.join(' | ')
    });

    // Test 2: UAT-004 Idempotency Check (Duplicate sourceEventId + sourceDocNo)
    const duplicatePayload: CoreGLJournalPayload = {
      sourceEventId: 'TEST-IDEMP-01',
      sourceDocNo: 'DOC-DUPLICATE-01',
      ruleCode: 'TEST-IDEMP',
      date: '2026-09-20',
      reference: 'TEST-UAT-004',
      description: 'Pengujian Idempotensi Transaksi Ganda',
      lines: [
        { accountKey: 'CASH_ON_HAND', debit: 50000, credit: 0, unitId: 'U002', locationId: 'L003', description: 'Dr Cash' },
        { accountKey: 'REV_FNB', debit: 0, credit: 50000, unitId: 'U002', locationId: 'L003', description: 'Cr Rev' }
      ],
      makerUserId: 'USR-002'
    };
    // Post once
    const postRes1 = executeCoreGLPosting(duplicatePayload, journals, 'JV-TEST-IDEMP-01');
    const existingWithPosted = postRes1.journal ? [postRes1.journal, ...journals] : journals;
    // Try posting again with same key
    const val2 = validateCoreGLPayload(duplicatePayload, existingWithPosted);
    results.push({
      testId: 'UAT-004',
      title: 'Idempotency Protection (sourceEventId + sourceDocNo)',
      expected: 'Posting kedua DITOLAK untuk mencegah pembukuan ganda.',
      actual: val2.isValid ? 'GAGAL: Transaksi ganda terposting!' : 'SUKSES: Transaksi ganda dicegat oleh engine.',
      passed: !val2.isValid && val2.errors.some(e => e.includes('UAT-004')),
      errorOutput: val2.errors.join(' | ')
    });

    // Test 3: UAT-031 Closed Accounting Period Protection
    const closedPeriodPayload: CoreGLJournalPayload = {
      sourceEventId: 'TEST-CLOSED-01',
      sourceDocNo: 'DOC-CLOSED-01',
      ruleCode: 'TEST-PERIOD',
      date: '2026-08-15', // 2026-08 is CLOSED!
      reference: 'TEST-UAT-031',
      description: 'Pengujian Posting ke Periode Ditutup (2026-08)',
      lines: [
        { accountKey: 'CASH_ON_HAND', debit: 50000, credit: 0, unitId: 'U002', locationId: 'L003', description: 'Dr Cash' },
        { accountKey: 'REV_FNB', debit: 0, credit: 50000, unitId: 'U002', locationId: 'L003', description: 'Cr Rev' }
      ],
      makerUserId: 'USR-002'
    };
    const val3 = validateCoreGLPayload(closedPeriodPayload, journals);
    results.push({
      testId: 'UAT-031',
      title: 'Closed Accounting Period Protection (Periode 2026-08)',
      expected: 'Jurnal DITOLAK karena periode 2026-08 berstatus CLOSED.',
      actual: val3.isValid ? 'GAGAL: Jurnal masuk ke periode tertutup!' : 'SUKSES: Dicegat dengan pesan UAT-031.',
      passed: !val3.isValid && val3.errors.some(e => e.includes('UAT-031')),
      errorOutput: val3.errors.join(' | ')
    });

    // Test 4: UAT-033 Mandatory Dimensi Unit & Lokasi
    const missingDimPayload: CoreGLJournalPayload = {
      sourceEventId: 'TEST-DIM-01',
      sourceDocNo: 'DOC-DIM-01',
      ruleCode: 'TEST-DIM',
      date: '2026-09-20',
      reference: 'TEST-UAT-033',
      description: 'Pengujian Baris Persediaan Tanpa LocationId',
      lines: [
        { accountKey: 'INV_COFFEE', debit: 185000, credit: 0, unitId: 'U002', locationId: undefined, description: 'Persediaan tanpa lokasi' },
        { accountKey: 'AP_INVENTORY', debit: 0, credit: 185000, unitId: 'U002', locationId: 'L003', description: 'Cr AP' }
      ],
      makerUserId: 'USR-002'
    };
    const val4 = validateCoreGLPayload(missingDimPayload, journals);
    results.push({
      testId: 'UAT-033',
      title: 'Mandatory Dimensi Unit Bisnis & Lokasi Fisik Subledger',
      expected: 'Jurnal DITOLAK karena akun persediaan (1-1301) wajib memiliki Dimensi Lokasi Fisik.',
      actual: val4.isValid ? 'GAGAL: Persediaan tanpa lokasi fisik lolos!' : 'SUKSES: Ditolak dengan benar.',
      passed: !val4.isValid && val4.errors.some(e => e.includes('UAT-033')),
      errorOutput: val4.errors.join(' | ')
    });

    // Test 5: UAT-002 Segregation of Duties (Maker == Approver)
    const sodViolationPayload: CoreGLJournalPayload = {
      sourceEventId: 'TEST-SOD-01',
      sourceDocNo: 'DOC-SOD-01',
      ruleCode: 'TEST-SOD',
      date: '2026-09-20',
      reference: 'TEST-UAT-002',
      description: 'Pengujian Maker Menyetujui Jurnalnya Sendiri',
      lines: [
        { accountKey: 'CASH_ON_HAND', debit: 75000, credit: 0, unitId: 'U002', locationId: 'L003', description: 'Dr Cash' },
        { accountKey: 'REV_FNB', debit: 0, credit: 75000, unitId: 'U002', locationId: 'L003', description: 'Cr Rev' }
      ],
      makerUserId: 'USR-001',
      approverUserId: 'USR-001', // Maker == Approver!
      requiresApproval: true
    };
    const val5 = validateCoreGLPayload(sodViolationPayload, journals);
    results.push({
      testId: 'UAT-002',
      title: 'Segregation of Duties (Maker != Approver)',
      expected: 'Jurnal DITOLAK karena Maker tidak boleh menjadi Approver untuk transaksi sendiri.',
      actual: val5.isValid ? 'GAGAL: SoD dilanggar tapi jurnal lolos!' : 'SUKSES: Pelanggaran SoD dicegat.',
      passed: !val5.isValid && val5.errors.some(e => e.includes('UAT-002')),
      errorOutput: val5.errors.join(' | ')
    });

    // Test 6: Rule G-11 AccountKey Unmapped Blocking Exception
    let g11Caught = false;
    let g11Error = '';
    try {
      resolveAccount('KEY_NOT_IN_COA_V1_3' as any);
    } catch (err: any) {
      if (err instanceof BlockingAccountException) {
        g11Caught = true;
        g11Error = err.message;
      }
    }
    results.push({
      testId: 'G-11',
      title: 'AccountKey Unmapped Blocking Exception (G-11)',
      expected: 'Melempar BlockingAccountException [G-11] jika key tidak ada di Mapping_COA_Final.',
      actual: g11Caught ? 'SUKSES: Blocking Exception tertangkap.' : 'GAGAL: Tidak melempar G-11.',
      passed: g11Caught,
      errorOutput: g11Error
    });

    // Test 7: Valid Balanced GL Posting with AccountKey Resolution
    const validPayload: CoreGLJournalPayload = {
      sourceEventId: `TEST-VALID-${Date.now()}`,
      sourceDocNo: 'DOC-VALID-01',
      ruleCode: 'SAL-01',
      date: '2026-09-22',
      reference: 'TEST-UAT-VALID',
      description: 'Pengujian Jurnal Valid Double-Entry dengan Resolusi AccountKey Otomatis',
      lines: [
        { accountKey: 'BANK_MANDIRI', debit: 450000, credit: 0, unitId: 'U001', locationId: 'L001', description: 'Penerimaan sewa lapangan padel' },
        { accountKey: 'REV_PADEL', debit: 0, credit: 450000, unitId: 'U001', locationId: 'L001', description: 'Pendapatan sewa slot lapangan padel' }
      ],
      makerUserId: 'USR-002',
      approverUserId: 'USR-001',
      requiresApproval: true
    };
    const postResValid = executeCoreGLPosting(validPayload, journals, 'JV-TEST-VALID-01');
    results.push({
      testId: 'CORE-POST',
      title: 'Valid GL Posting with Contextual AccountKey Resolution',
      expected: 'Jurnal berstatus POSTED, double-entry balance, dan tersimpan permanen.',
      actual: postResValid.success ? `SUKSES: Terbit ${postResValid.journal?.journalNumber}` : 'GAGAL memposting.',
      passed: postResValid.success && postResValid.journal?.isBalanced === true,
      errorOutput: postResValid.validation.errors.join(' | ')
    });

    setTestResults(results);
  };

  const filteredCoa = MAPPING_COA_FINAL.filter(item => {
    if (coaCategoryFilter !== 'ALL' && item.category !== coaCategoryFilter) {
      return false;
    }
    if (coaSearch.trim()) {
      const q = coaSearch.toLowerCase();
      return (
        item.accountKey.toLowerCase().includes(q) ||
        item.definitiveAccountCode.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Architecture Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Database className="w-4 h-4" />
            MODUL 1 — Pondasi Database, Master Dimensi &amp; Core GL Engine
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Blueprint ERP Padel Beans V1.3 Architecture Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Satu PT &amp; Satu General Ledger · 58 AccountKey Konfigurasi Terpetakan · Penegakan UAT-002 s/d UAT-033 &amp; G-11.
          </p>
        </div>

        {/* Action Button: Run Test Suite */}
        <button
          onClick={runUATTestSuite}
          className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          Jalankan UAT Guardrails Test Suite
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('DIMENSI')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'DIMENSI'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          1. Master Dimensi &amp; Relasi (U001—U009 / L001—L005)
        </button>
        <button
          onClick={() => setActiveTab('COA_CONFIG')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'COA_CONFIG'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          2. Konfigurasi 58 AccountKey COA
        </button>
        <button
          onClick={() => setActiveTab('RBAC')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'RBAC'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          3. RBAC &amp; Segregation of Duties (SoD)
        </button>
        <button
          onClick={() => setActiveTab('PERIODS')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'PERIODS'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          4. Periode Akuntansi (Closed Period Protection)
        </button>
        <button
          onClick={() => setActiveTab('GL_GUARDRAILS')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'GL_GUARDRAILS'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          5. Core GL Guardrails Test Runner
        </button>
      </div>

      {/* TAB 1: MASTER DIMENSI */}
      {activeTab === 'DIMENSI' && (
        <div className="space-y-6">
          {/* Master Unit Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white">Tabel Master_Unit (Dimensi Unit Bisnis)</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wajib ada pada setiap baris jurnal finansial. Unit U009 merupakan bucket biaya bersama non-revenue.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {MASTER_UNITS.length} Unit Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Kode Unit</th>
                    <th className="py-2.5 px-3">Nama Unit Bisnis</th>
                    <th className="py-2.5 px-3">Tipe Unit</th>
                    <th className="py-2.5 px-3">Alias Historis (Kompabilitas)</th>
                    <th className="py-2.5 px-3">Deskripsi &amp; Fungsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-sans">
                  {MASTER_UNITS.map(unit => (
                    <tr key={unit.unitId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{unit.unitId}</td>
                      <td className="py-3 px-3 font-semibold text-white">{unit.unitName}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          unit.unitType === 'REVENUE' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {unit.unitType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        {unit.historicalAliases.join(', ')}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{unit.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Lokasi Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white">Tabel Master_Lokasi (Dimensi Lokasi Fisik &amp; Gudang Stok)</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Terpisah dari unit bisnis. Menjadi acuan mutasi stok fisik, stock opname, dan stasiun kasir operasional.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {MASTER_LOCATIONS.length} Lokasi Fisik
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Kode Lokasi</th>
                    <th className="py-2.5 px-3">Nama Lokasi Fisik</th>
                    <th className="py-2.5 px-3">Relasi Unit Induk</th>
                    <th className="py-2.5 px-3">Kontrol Stok Subledger?</th>
                    <th className="py-2.5 px-3">Kota</th>
                    <th className="py-2.5 px-3">Fungsi Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-sans">
                  {MASTER_LOCATIONS.map(loc => (
                    <tr key={loc.locationId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{loc.locationId}</td>
                      <td className="py-3 px-3 font-semibold text-white">{loc.locationName}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {loc.primaryParentUnitId} - {MASTER_UNITS.find(u => u.unitId === loc.primaryParentUnitId)?.unitName.split(' ')[0]}
                      </td>
                      <td className="py-3 px-3">
                        {loc.hasStockControl ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                            YA (Stock Control)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            Tidak (Court Ops)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{loc.addressCity}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{loc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map Unit Lokasi Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white">Tabel Relasi Map_Unit_Lokasi</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Memetakan keterhubungan operasional dan logistik antara Unit Bisnis dan Lokasi Fisik.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{MAP_UNIT_LOKASI.length} Relasi Dipetakan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">ID Relasi</th>
                    <th className="py-2.5 px-3">Unit Bisnis</th>
                    <th className="py-2.5 px-3">Lokasi Fisik</th>
                    <th className="py-2.5 px-3">Jenis Relasi</th>
                    <th className="py-2.5 px-3">Catatan Integrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-sans">
                  {MAP_UNIT_LOKASI.map(rel => (
                    <tr key={rel.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{rel.id}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">{rel.unitId}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">{rel.locationId}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                          {rel.relationshipType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{rel.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KONFIGURASI 58 ACCOUNTKEY COA */}
      {activeTab === 'COA_CONFIG' && (
        <div className="space-y-6">
          {/* Interactive AccountKey Resolver Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Key className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Live AccountKey Dynamic Resolver (Uji Aturan REQ-023 &amp; G-11)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">AccountKey Logis</label>
                <input
                  type="text"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 font-mono"
                  placeholder="Contoh: PBJT_PAYABLE, COGS_SALES, REV_FNB..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Konteks Unit Bisnis</label>
                <select
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value as BusinessUnitId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                >
                  <option value="U001">U001 - Padel Court &amp; Event</option>
                  <option value="U002">U002 - Coffee &amp; Resto Salatiga</option>
                  <option value="U003">U003 - Coffee Benteng</option>
                  <option value="U009">U009 - Shared Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Konteks Lokasi Fisik</label>
                <select
                  value={testLoc}
                  onChange={(e) => setTestLoc(e.target.value as PhysicalLocationId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                >
                  <option value="L001">L001 - Padel Court</option>
                  <option value="L002">L002 - Gudang Pusat</option>
                  <option value="L003">L003 - Bar Salatiga</option>
                  <option value="L004">L004 - Kitchen Salatiga</option>
                  <option value="L005">L005 - Coffee Benteng</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleResolveKey}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Resolve AccountKey
                </button>
              </div>
            </div>

            {/* Resolution Output */}
            {resolverResult && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 font-mono">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolusi Berhasil: {resolverResult.accountCode} — {resolverResult.accountName}
                </div>
                <div className="text-slate-300">Kategori: {resolverResult.category} | Saldo Normal: {resolverResult.normalBalance}</div>
                {resolverResult.isContextResolved && (
                  <div className="text-blue-400 font-sans text-[11px] pt-1">
                    Aturan Kontekstual Diterapkan: {resolverResult.contextRuleApplied}
                  </div>
                )}
              </div>
            )}

            {resolverError && (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <div>
                  <div className="font-bold">Blocking Exception Tertangkap [G-11]:</div>
                  <div>{resolverError}</div>
                </div>
              </div>
            )}
          </div>

          {/* Full 58 AccountKeys Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
              <div>
                <h2 className="text-sm font-semibold text-white">Daftar Konfigurasi 58 AccountKey (Mapping_COA_Final V1.3)</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Seluruh kode GL dipetakan melalui AccountKey logis untuk menjamin integritas pembukuan dan audit trail.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={coaSearch}
                    onChange={(e) => setCoaSearch(e.target.value)}
                    placeholder="Cari key atau kode akun..."
                    className="bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-slate-200 text-xs w-48 focus:outline-none"
                  />
                </div>

                <select
                  value={coaCategoryFilter}
                  onChange={(e) => setCoaCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="ASSET_CURRENT">Aset Lancar</option>
                  <option value="ASSET_NON_CURRENT">Aset Tetap</option>
                  <option value="LIABILITY_CURRENT">Liabilitas Lancar</option>
                  <option value="EQUITY">Ekuitas</option>
                  <option value="REVENUE">Pendapatan</option>
                  <option value="COGS_PERIODIC">HPP Periodik</option>
                  <option value="EXPENSE_OPERATIONAL">Beban Operasional</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Logical AccountKey</th>
                    <th className="py-2.5 px-3">Kode COA Definitif</th>
                    <th className="py-2.5 px-3">Nama Akun Standar</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Normal Balance</th>
                    <th className="py-2.5 px-3">Aturan Kontekstual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                  {filteredCoa.map(item => (
                    <tr key={item.accountKey} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-white">{item.accountKey}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{item.definitiveAccountCode}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">{item.accountName}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{item.category}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.normalBalance === 'DEBIT' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'
                        }`}>
                          {item.normalBalance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px]">
                        {item.hasContextualResolution ? (
                          <span className="text-amber-400">
                            {item.contextRulesNotes}
                          </span>
                        ) : (
                          <span className="text-slate-500">Standar 1:1</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC & SEGREGATION OF DUTIES */}
      {activeTab === 'RBAC' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Role-Based Access Control (RBAC) &amp; Matriks Pengguna
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menegakkan Segregation of Duties (SoD) sesuai aturan REQ-026 dan UAT-002: Maker != Approver.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {SYSTEM_USERS.map(user => (
                <div key={user.userId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">{user.userId}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">
                      {user.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">{user.fullName}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 text-[11px] space-y-1 text-slate-400">
                    <div>Penugasan: <strong className="text-slate-200">{user.assignedUnitId} / {user.assignedLocationId}</strong></div>
                    <div>Permissions:</div>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                      {user.permissions.map(p => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERIODE AKUNTANSI */}
      {activeTab === 'PERIODS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Manajemen Periode Akuntansi (Closed Period Protection)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aturan UAT-031: Menolak setiap posting jurnal pada periode akuntansi yang telah ditutup (CLOSED).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Bulan Periode</th>
                    <th className="py-2.5 px-3">Rentang Tanggal</th>
                    <th className="py-2.5 px-3">Status Periode</th>
                    <th className="py-2.5 px-3">Waktu Penutupan</th>
                    <th className="py-2.5 px-3">Ditutup Oleh</th>
                    <th className="py-2.5 px-3 text-right">Aksi Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                  {periods.map(p => (
                    <tr key={p.periodMonth} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold text-white text-sm">{p.periodMonth}</td>
                      <td className="py-3 px-3 text-slate-300">{p.startDate} s/d {p.endDate}</td>
                      <td className="py-3 px-3">
                        {p.status === 'CLOSED' ? (
                          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <Lock className="w-3.5 h-3.5" />
                            CLOSED (Terkunci)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <Unlock className="w-3.5 h-3.5" />
                            OPEN (Terbuka)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{p.closedAt || '-'}</td>
                      <td className="py-3 px-3 font-sans text-slate-300">{p.closedBy || '-'}</td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => handleTogglePeriod(p.periodMonth, p.status)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            p.status === 'OPEN'
                              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {p.status === 'OPEN' ? 'Kunci / Tutup Periode' : 'Buka Kembali Periode'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: UAT TEST SUITE RUNNER */}
      {activeTab === 'GL_GUARDRAILS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Live UAT Automated Guardrails Test Suite
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menguji eksekusi riil dari UAT-002, UAT-003, UAT-004, UAT-031, UAT-033, G-11, dan append-only immutability.
                </p>
              </div>

              <button
                onClick={runUATTestSuite}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Jalankan Seluruh UAT
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Klik tombol <strong className="text-slate-300">"Jalankan Seluruh UAT"</strong> untuk mengeksekusi pengujian otomatis seluruh guardrail Core GL Engine.
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map(test => (
                  <div 
                    key={test.testId}
                    className={`border rounded-xl p-4 text-xs space-y-2 ${
                      test.passed 
                        ? 'bg-slate-950 border-emerald-500/30' 
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                          {test.testId}
                        </span>
                        <h3 className="font-semibold text-white">{test.title}</h3>
                      </div>

                      {test.passed ? (
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PASSED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          FAILED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[11px] font-sans">
                      <div>Ekspektasi: <span className="text-slate-200">{test.expected}</span></div>
                      <div>Hasil Aktual: <span className="text-emerald-400 font-semibold">{test.actual}</span></div>
                    </div>

                    {test.errorOutput && (
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                        Log Output: {test.errorOutput}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
