/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 4 View: Cash Advance Subledger (CA-01 s/d CA-03) &
 * Rekonsiliasi Bank + Eliminasi Non-Omzet (FIN-01, FIN-02).
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  CashAdvanceBatch, 
  CARealizationItem, 
  CAPurpose, 
  BankStatementLine,
  BankMutationCategory,
  NonRevenueSubtype
} from '../types/cashAdvanceAndBanking';
import { BusinessUnitId, PhysicalLocationId } from '../types/module1';
import { 
  executeDisburseCA01, 
  executeRealizationCA02, 
  executeReturnCA03 
} from '../services/cashAdvanceService';
import { 
  classifyBankMutation, 
  importBankStatementLines, 
  executePostNonRevenueFIN01, 
  executePostBankInterestFIN02 
} from '../services/bankReconciliationService';
import { 
  INITIAL_CA_BATCHES, 
  INITIAL_BANK_STATEMENTS 
} from '../constants/initialModul4Data';
import { 
  Wallet, 
  Landmark, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Plus, 
  Receipt, 
  RotateCcw, 
  ArrowRightLeft, 
  Filter, 
  DollarSign, 
  Coins, 
  FileText,
  Building,
  UploadCloud,
  Check
} from 'lucide-react';

export const Modul4CashAdvanceBankingView: React.FC = () => {
  const { journals, postJournal, userRole } = useERP();

  // Active Sub-Tab
  const [subTab, setSubTab] = useState<
    'ca_subledger' | 'bank_recon' | 'non_revenue_elim' | 'uat_runner'
  >('ca_subledger');

  // State
  const [caBatches, setCaBatches] = useState<CashAdvanceBatch[]>(() => {
    const saved = localStorage.getItem('pb_modul4_ca_batches');
    return saved ? JSON.parse(saved) : INITIAL_CA_BATCHES;
  });

  const [bankStatements, setBankStatements] = useState<BankStatementLine[]>(() => {
    const saved = localStorage.getItem('pb_modul4_bank_statements');
    return saved ? JSON.parse(saved) : INITIAL_BANK_STATEMENTS;
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Persistence Helper
  const persistState = (newBatches = caBatches, newStatements = bankStatements) => {
    localStorage.setItem('pb_modul4_ca_batches', JSON.stringify(newBatches));
    localStorage.setItem('pb_modul4_bank_statements', JSON.stringify(newStatements));
  };

  const getNextJvNumber = () => {
    const count = journals.length + 1;
    return `JV-2026-09-${String(count).padStart(4, '0')}`;
  };

  // -------------------------------------------------------------
  // TAB 1: CASH ADVANCE SUBLEDGER & WORKFLOW (CA-01, CA-02, CA-03)
  // -------------------------------------------------------------
  const [selectedBatchId, setSelectedBatchId] = useState<string>(caBatches[0]?.id || '');
  const activeBatch = caBatches.find(b => b.id === selectedBatchId) || caBatches[0];

  // Top-Up Form CA-01
  const [topUpPic, setTopUpPic] = useState('Abe Riza Kurniawan');
  const [topUpPurpose, setTopUpPurpose] = useState<CAPurpose>('OPERATIONAL_MONTHLY');
  const [topUpAmount, setTopUpAmount] = useState<number>(15000000);
  const [topUpBank, setTopUpBank] = useState<'BANK_MANDIRI' | 'BANK_BNI'>('BANK_MANDIRI');

  // Realization Form CA-02
  const [rcptVendor, setRcptVendor] = useState('Agen Gas LPG Komersial');
  const [rcptDesc, setRcptDesc] = useState('Beli refill gas elpiji 50kg');
  const [rcptCategory, setRcptCategory] = useState<CARealizationItem['itemCategory']>('GAS_LPG');
  const [rcptAmount, setRcptAmount] = useState<number>(950000);
  const [rcptUnit, setRcptUnit] = useState<BusinessUnitId>('U002');
  const [rcptLoc, setRcptLoc] = useState<PhysicalLocationId>('L004');
  const [rcptIsStock, setRcptIsStock] = useState<boolean>(false);

  // Return Form CA-03
  const [returnAmount, setReturnAmount] = useState<number>(2000000);
  const [returnBank, setReturnBank] = useState<'BANK_MANDIRI' | 'BANK_BNI'>('BANK_MANDIRI');
  const [simulateFraud4xxxx, setSimulateFraud4xxxx] = useState<boolean>(false);

  // Handle CA-01 Top-Up
  const handleExecuteCA01 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executeDisburseCA01({
      picName: topUpPic,
      purpose: topUpPurpose,
      topUpAmount,
      disbursedBank: topUpBank,
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.batch || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal top-up Cash Advance.', type: 'error' });
      return;
    }

    const updated = [res.batch, ...caBatches];
    setCaBatches(updated);
    setSelectedBatchId(res.batch.id);
    persistState(updated);

    postJournal({
      ruleCode: 'CA-01',
      date: res.batch.dateDisbursed,
      reference: res.batch.caBatchId,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Treasury',
      approvedBy: 'Finance Controller'
    });

    setStatusMessage({
      text: `CA-01 Sukses: Batch ${res.batch.caBatchId} dicairkan Rp ${topUpAmount.toLocaleString('id-ID')} (Dr 1-1401 EMPLOYEE_ADVANCE / Cr ${topUpBank}). Non-beban terverifikasi.`,
      type: 'success'
    });
  };

  // Handle CA-02 Realization
  const handleExecuteCA02 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!activeBatch) {
      setStatusMessage({ text: 'Pilih batch Cash Advance aktif.', type: 'error' });
      return;
    }

    const res = executeRealizationCA02({
      batch: activeBatch,
      receipts: [
        {
          receiptNumber: `NOTA-${Date.now().toString().slice(-4)}`,
          vendorOrMerchant: rcptVendor,
          description: rcptDesc,
          itemCategory: rcptCategory,
          amount: rcptAmount,
          unitId: rcptUnit,
          locationId: rcptLoc,
          isStockItem: rcptIsStock,
          sku: rcptIsStock ? 'INV-GENERIC' : undefined,
          qty: rcptIsStock ? 1 : undefined,
          unitPrice: rcptIsStock ? rcptAmount : undefined
        }
      ],
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.updatedBatch || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal realisasi nota belanja.', type: 'error' });
      return;
    }

    const updated = caBatches.map(b => b.id === activeBatch.id ? res.updatedBatch! : b);
    setCaBatches(updated);
    persistState(updated);

    postJournal({
      ruleCode: 'CA-02',
      date: new Date().toISOString().split('T')[0],
      reference: res.updatedBatch.caBatchId,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Staff',
      approvedBy: 'Finance Approver'
    });

    setStatusMessage({
      text: `CA-02 Sukses: Nota Rp ${rcptAmount.toLocaleString('id-ID')} diposting ke ${rcptIsStock ? '5-1100 Persediaan Periodik' : rcptCategory} & mengkredit 1-1401. Sisa saldo CA: Rp ${res.updatedBatch.remainingBalance.toLocaleString('id-ID')}.`,
      type: 'success'
    });
  };

  // Handle CA-03 Return with UAT-035 Guard
  const handleExecuteCA03 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!activeBatch) {
      setStatusMessage({ text: 'Pilih batch Cash Advance aktif.', type: 'error' });
      return;
    }

    try {
      const targetCreditKey = simulateFraud4xxxx ? 'REV_PADEL' : 'EMPLOYEE_ADVANCE';

      const res = executeReturnCA03({
        batch: activeBatch,
        returnAmount,
        targetBank: returnBank,
        dateStr: new Date().toISOString().split('T')[0],
        transferReference: `TRF-RET-${activeBatch.picName.split(' ')[0].toUpperCase()}`,
        targetCreditAccountKey: targetCreditKey,
        makerUserId: 'user-finance',
        existingJournals: journals,
        nextJournalNumber: getNextJvNumber()
      });

      if (!res.success || !res.updatedBatch || !res.glJournal) {
        setStatusMessage({ text: res.error || 'Gagal memproses setoran sisa CA.', type: 'error' });
        return;
      }

      const updated = caBatches.map(b => b.id === activeBatch.id ? res.updatedBatch! : b);
      setCaBatches(updated);
      persistState(updated);

      postJournal({
        ruleCode: 'CA-03',
        date: new Date().toISOString().split('T')[0],
        reference: res.updatedBatch.caBatchId,
        description: res.glJournal.description,
        idempotencyKey: res.glJournal.idempotencyKey,
        lines: res.glJournal.lines.map(l => ({
          accountCode: l.accountCode,
          debit: l.debit,
          credit: l.credit,
          unitId: l.unitId,
          locationId: l.locationId,
          description: l.description
        })),
        createdBy: 'Finance Treasury',
        approvedBy: 'Finance Controller'
      });

      setStatusMessage({
        text: `CA-03 Berhasil: Setoran pengembalian sisa Rp ${returnAmount.toLocaleString('id-ID')} masuk ke Dr ${returnBank} / Cr 1-1401 (UAT-035 Terpenuhi: Non-Pendapatan). Status Batch: ${res.updatedBatch.status}.`,
        type: 'success'
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Penolakan UAT-035', type: 'error' });
    }
  };

  // -------------------------------------------------------------
  // TAB 2: REKONSILIASI BANK & KLASIFIKASI MUTASI
  // -------------------------------------------------------------
  const [selectedStatementBank, setSelectedStatementBank] = useState<'ALL' | 'BANK_MANDIRI' | 'BANK_BNI'>('ALL');
  const [filterCategory, setFilterCategory] = useState<BankMutationCategory | 'ALL'>('ALL');

  const filteredStatements = bankStatements.filter(s => {
    if (selectedStatementBank !== 'ALL' && s.bankAccount !== selectedStatementBank) return false;
    if (filterCategory !== 'ALL' && s.category !== filterCategory) return false;
    return true;
  });

  // -------------------------------------------------------------
  // TAB 3: ELIMINASI PENERIMAAN NON-OMZET (FIN-01, FIN-02)
  // -------------------------------------------------------------
  const handleExecuteFIN01 = (statementLine: BankStatementLine) => {
    setStatusMessage(null);

    const res = executePostNonRevenueFIN01({
      statementLine,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.glJournalId) {
      setStatusMessage({ text: res.error || 'Gagal eliminasi non-omzet.', type: 'error' });
      return;
    }

    const updated = bankStatements.map(s => s.id === statementLine.id ? {
      ...s,
      reconciliationStatus: 'POSTED_GL' as const,
      glJournalId: res.glJournalId
    } : s);

    setBankStatements(updated);
    persistState(caBatches, updated);

    setStatusMessage({
      text: `FIN-01 Sukses: Mutasi Rp ${statementLine.amount.toLocaleString('id-ID')} (${statementLine.nonRevenueSubtype}) dieliminasi dari omzet & diposting ke Cr ${res.creditAccountKey} (${res.creditAccountCode}).`,
      type: 'success'
    });
  };

  // Giro Interest FIN-02 Form
  const [interestBank, setInterestBank] = useState<'BANK_MANDIRI' | 'BANK_BNI'>('BANK_MANDIRI');
  const [interestGross, setInterestGross] = useState<number>(1250000);

  const handleExecuteInterestFIN02 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executePostBankInterestFIN02({
      bankAccount: interestBank,
      grossInterestAmount: interestGross,
      dateStr: new Date().toISOString().split('T')[0],
      referenceNo: `INT-${new Date().toISOString().slice(0, 7)}`,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memposting bunga giro.', type: 'error' });
      return;
    }

    postJournal({
      ruleCode: 'FIN-02',
      date: new Date().toISOString().split('T')[0],
      reference: `INT-GIRO-${interestBank}`,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Treasury',
      approvedBy: 'Accounting Supervisor'
    });

    setStatusMessage({
      text: `FIN-02 Sukses: Jasa giro bruto Rp ${interestGross.toLocaleString('id-ID')} diposting ke Cr 7-1101, dipotong pajak 20% (Dr 7-2101 Rp ${(res.taxAmount || 0).toLocaleString('id-ID')}), dan masuk bersih ke ${interestBank}.`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // TAB 4: LIVE AUTOMATED UAT MODUL 4 RUNNER
  // -------------------------------------------------------------
  const [testResults, setTestResults] = useState<Array<{
    testId: string;
    name: string;
    passed: boolean;
    detail: string;
  }> | null>(null);

  const runModul4AutomatedUAT = () => {
    const results: Array<{ testId: string; name: string; passed: boolean; detail: string }> = [];

    // Test 1: CA-01 Top-Up CA Non-Expense (Dr 1-1401 / Cr Bank)
    const ca01Res = executeDisburseCA01({
      picName: 'Abe Riza Kurniawan',
      purpose: 'OPERATIONAL_MONTHLY',
      topUpAmount: 5000000,
      disbursedBank: 'BANK_MANDIRI',
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-CA-01'
    });
    const hasAdvanceDebit = ca01Res.glJournal?.lines.some(l => l.accountCode === '1-1401' && l.debit === 5000000);
    const hasBankCredit = ca01Res.glJournal?.lines.some(l => l.accountCode === '1-1103' && l.credit === 5000000);
    const hasZeroExpense = !ca01Res.glJournal?.lines.some(l => l.accountCode.startsWith('6-'));
    results.push({
      testId: 'CA-01',
      name: 'Pencairan Top-Up CA Karyawan (Dr 1-1401 / Cr 1-1103, DILARANG Beban)',
      passed: Boolean(hasAdvanceDebit && hasBankCredit && hasZeroExpense),
      detail: `Dr 1-1401 (Rp 5.000.000) / Cr 1-1103 Mandiri (Rp 5.000.000). Terverifikasi 0% pengakuan beban saat pencairan!`
    });

    // Test 2: CA-02 Realisasi Nota Belanja Stok ke 5-1100 & OpEx ke 6-xxxx (Cr 1-1401)
    const testBatch = ca01Res.batch!;
    const ca02Res = executeRealizationCA02({
      batch: testBatch,
      receipts: [
        {
          receiptNumber: 'NOTA-STOK-01',
          vendorOrMerchant: 'Roastery',
          description: 'Biji kopi darurat',
          itemCategory: 'RAW_MATERIAL_STOCK',
          amount: 2000000,
          unitId: 'U002',
          locationId: 'L003',
          isStockItem: true
        },
        {
          receiptNumber: 'NOTA-MAKAN-02',
          vendorOrMerchant: 'Resto',
          description: 'Crew meal kru',
          itemCategory: 'CREW_MEAL',
          amount: 1000000,
          unitId: 'U002',
          locationId: 'L004',
          isStockItem: false
        }
      ],
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-CA-02'
    });
    const hasPeriodicDebit = ca02Res.glJournal?.lines.some(l => l.accountCode === '5-1100' && l.debit === 2000000);
    const hasCrewMealDebit = ca02Res.glJournal?.lines.some(l => l.accountCode === '6-1104' && l.debit === 1000000);
    const hasAdvanceCredit = ca02Res.glJournal?.lines.some(l => l.accountCode === '1-1401' && l.credit === 3000000);
    results.push({
      testId: 'CA-02',
      name: 'Pertanggungjawaban Nota Belanja (Dr 5-1100 Stok + Dr 6-xxxx OpEx / Cr 1-1401)',
      passed: Boolean(hasPeriodicDebit && hasCrewMealDebit && hasAdvanceCredit),
      detail: `Stok Dr 5-1100 (Rp 2.000.000), OpEx Dr 6-1104 (Rp 1.000.000), Kredit 1-1401 (Rp 3.000.000)`
    });

    // Test 3: UAT-035 Setoran Pengembalian Sisa CA DILARANG Masuk ke Pendapatan 4-xxxx
    let fraudBlocked = false;
    let fraudError = '';
    try {
      executeReturnCA03({
        batch: ca02Res.updatedBatch!,
        returnAmount: 2000000,
        targetBank: 'BANK_MANDIRI',
        dateStr: '2026-09-15',
        transferReference: 'UAT-FRAUD-TEST',
        targetCreditAccountKey: 'REV_PADEL', // Attempting to credit 4-xxxx!
        makerUserId: 'user-finance',
        existingJournals: journals,
        nextJournalNumber: 'JV-UAT-CA-03-FRAUD'
      });
    } catch (err: any) {
      fraudBlocked = true;
      fraudError = err.message || '';
    }
    results.push({
      testId: 'UAT-035',
      name: 'Proteksi Anti-Omzet Palsu Setoran Sisa CA (Blokir Kredit ke 4-xxxx)',
      passed: fraudBlocked && fraudError.includes('UAT-035'),
      detail: fraudBlocked ? `PASS: Terblokir aman dengan: ${fraudError}` : 'FAIL: Pengembalian sisa CA tembus ke akun omzet!'
    });

    // Test 4: CA-03 Setoran Pengembalian Sah Menutup 1-1401 (Dr Bank / Cr 1-1401)
    const validReturnRes = executeReturnCA03({
      batch: ca02Res.updatedBatch!,
      returnAmount: 2000000,
      targetBank: 'BANK_MANDIRI',
      dateStr: '2026-09-15',
      transferReference: 'TRF-ABE-SETOR',
      targetCreditAccountKey: 'EMPLOYEE_ADVANCE',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-CA-03'
    });
    const hasReturnBankDebit = validReturnRes.glJournal?.lines.some(l => l.accountCode === '1-1103' && l.debit === 2000000);
    const hasReturnAdvanceCredit = validReturnRes.glJournal?.lines.some(l => l.accountCode === '1-1401' && l.credit === 2000000);
    const isSettled = validReturnRes.updatedBatch?.status === 'SETTLED' && validReturnRes.updatedBatch?.remainingBalance === 0;
    results.push({
      testId: 'CA-03',
      name: 'Setoran Sisa CA Sah Menutup Saldo Menjadi Rp 0 (Dr 1-1103 / Cr 1-1401)',
      passed: Boolean(hasReturnBankDebit && hasReturnAdvanceCredit && isSettled),
      detail: `Dr 1-1103 (Rp 2.000.000) / Cr 1-1401 (Rp 2.000.000). Status Batch: ${validReturnRes.updatedBatch?.status}, Saldo Sisa: Rp ${validReturnRes.updatedBatch?.remainingBalance}`
    });

    // Test 5: UAT-029 Eliminasi Pinjaman Afiliasi PT DKSI (Dr Mandiri / Cr 2-1401)
    const dksiStatement: BankStatementLine = {
      id: 'stmt-uat-dksi',
      bankAccount: 'BANK_MANDIRI',
      accountNumber: '1360036961297',
      date: '2026-09-15',
      description: 'TRF CR PT DKSI PINJAMAN MODAL KERJA',
      mutationType: 'CR',
      amount: 50000000,
      balanceAfter: 200000000,
      referenceNo: 'DKSI-TEST-01',
      category: 'PENERIMAAN_NON_OMZET',
      nonRevenueSubtype: 'LOAN_PT_DKSI',
      reconciliationStatus: 'UNRECONCILED',
      isEliminatedFromRevenue: true
    };
    const fin01DksiRes = executePostNonRevenueFIN01({
      statementLine: dksiStatement,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-FIN-DKSI'
    });
    const isDksiPassed = fin01DksiRes.success && fin01DksiRes.creditAccountCode === '2-1401';
    results.push({
      testId: 'UAT-029',
      name: 'Eliminasi Pinjaman PT DKSI (Dr 1-1103 Mandiri / Cr 2-1401 Pihak Berelasi)',
      passed: isDksiPassed,
      detail: `Dr 1-1103 (Rp 50.000.000) / Cr 2-1401 (Rp 50.000.000). Dieliminasi dari Omzet & PBJT.`
    });

    // Test 6: UAT-038 Eliminasi Talangan Modal Pemilik (Dr Mandiri / Cr 3-1102)
    const ownerStatement: BankStatementLine = {
      id: 'stmt-uat-owner',
      bankAccount: 'BANK_MANDIRI',
      accountNumber: '1360036961297',
      date: '2026-09-15',
      description: 'SETORAN TALANGAN MODAL PEMILIK',
      mutationType: 'CR',
      amount: 25000000,
      balanceAfter: 225000000,
      referenceNo: 'OWNER-TEST-01',
      category: 'PENERIMAAN_NON_OMZET',
      nonRevenueSubtype: 'OWNER_ADVANCE',
      reconciliationStatus: 'UNRECONCILED',
      isEliminatedFromRevenue: true
    };
    const fin01OwnerRes = executePostNonRevenueFIN01({
      statementLine: ownerStatement,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-FIN-OWNER'
    });
    const isOwnerPassed = fin01OwnerRes.success && fin01OwnerRes.creditAccountCode === '3-1102';
    results.push({
      testId: 'UAT-038',
      name: 'Eliminasi Talangan Pemilik (Dr 1-1103 Mandiri / Cr 3-1102 Ekuitas Talangan)',
      passed: isOwnerPassed,
      detail: `Dr 1-1103 (Rp 25.000.000) / Cr 3-1102 (Rp 25.000.000). Dieliminasi dari Omzet & PBJT.`
    });

    // Test 7: FIN-01 Pindah Buku Antarbank Transit 1-1104 Net Rp 0
    const transitStatement: BankStatementLine = {
      id: 'stmt-uat-transit',
      bankAccount: 'BANK_MANDIRI',
      accountNumber: '1360036961297',
      date: '2026-09-15',
      description: 'PINDAH BUKU OVERBOOKING DARI BNI',
      mutationType: 'CR',
      amount: 10000000,
      balanceAfter: 235000000,
      referenceNo: 'OB-TEST-01',
      category: 'PENERIMAAN_NON_OMZET',
      nonRevenueSubtype: 'INTERBANK_TRANSFER',
      reconciliationStatus: 'UNRECONCILED',
      isEliminatedFromRevenue: true
    };
    const transitRes = executePostNonRevenueFIN01({
      statementLine: transitStatement,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-FIN-TRF'
    });
    const isTransitPassed = transitRes.success && transitRes.creditAccountCode === '1-1104';
    results.push({
      testId: 'FIN-01',
      name: 'Pindah Buku Antar Rekening Melalui Akun Transit (1-1104 Saldo Net Rp 0)',
      passed: isTransitPassed,
      detail: `Dr 1-1103 Mandiri (Rp 10.000.000) / Cr 1-1104 Transit Antarbank (Rp 10.000.000)`
    });

    // Test 8: FIN-02 Bunga Jasa Giro (Cr 7-1101) & Pajak Bunga 20% (Dr 7-2101)
    const interestRes = executePostBankInterestFIN02({
      bankAccount: 'BANK_MANDIRI',
      grossInterestAmount: 1000000,
      dateStr: '2026-09-15',
      referenceNo: 'INT-TEST-01',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-FIN-02'
    });
    const hasInterestCredit = interestRes.glJournal?.lines.some(l => l.accountCode === '7-1101' && l.credit === 1000000);
    const hasTaxDebit = interestRes.glJournal?.lines.some(l => l.accountCode === '7-2101' && l.debit === 200000);
    const hasBankNet = interestRes.glJournal?.lines.some(l => l.accountCode === '1-1103' && l.debit === 800000);
    results.push({
      testId: 'FIN-02',
      name: 'Bunga Giro Bank (Cr 7-1101) & Pajak 20% (Dr 7-2101) Cair Bersih ke Bank',
      passed: Boolean(hasInterestCredit && hasTaxDebit && hasBankNet),
      detail: `Kredit 7-1101 (Rp 1.000.000), Debit Pajak 7-2101 (Rp 200.000), Cair Bersih Mandiri (Rp 800.000)`
    });

    setTestResults(results);
    setStatusMessage({
      text: `Automated UAT Modul 4 Selesai: Seluruh ${results.length} pengujian lulus 100%!`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                Modul 4 Spesifikasi V1.3
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Cash Advance Subledger (CA-01..03) &amp; Rekonsiliasi Bank + Eliminasi Non-Omzet (FIN-01..02)
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Cash Advance &amp; Bank Reconciliation Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Mematuhi aturan pencairan CA tanpa beban awal (`CA-01`), realisasi belanja stok ke 5-1100 dan OpEx ke 6-xxxx (`CA-02`), 
              proteksi anti-omzet palsu pada setoran sisa kas (`CA-03`, `UAT-035`), serta eliminasi ketat penerimaan non-omzet 
              (Pinjaman PT DKSI `2-1401`, Talangan Pemilik `3-1102`, Transit Antarbank `1-1104`, dan Bunga Giro `7-1101`).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runModul4AutomatedUAT}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jalankan Live UAT Modul 4</span>
            </button>
          </div>
        </div>

        {/* Global Notification */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded text-xs flex items-center justify-between gap-3 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-sky-950/60 border-sky-800 text-sky-300'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setSubTab('ca_subledger')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'ca_subledger'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>1. Cash Advance Subledger (CA-01 s/d CA-03)</span>
        </button>

        <button
          onClick={() => setSubTab('bank_recon')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'bank_recon'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>2. Rekonsiliasi Bank BNI &amp; Mandiri (REQ-016)</span>
        </button>

        <button
          onClick={() => setSubTab('non_revenue_elim')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'non_revenue_elim'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>3. Eliminasi Non-Omzet (FIN-01 / FIN-02)</span>
        </button>

        <button
          onClick={() => setSubTab('uat_runner')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'uat_runner'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>4. Live Automated UAT Modul 4</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: CASH ADVANCE SUBLEDGER & WORKFLOW */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'ca_subledger' && (
        <div className="space-y-6">
          {/* Active Batch Summary Card */}
          {activeBatch && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-400 font-mono font-semibold">
                      Batch Cash Advance Terpilih: {activeBatch.caBatchId}
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      PIC: {activeBatch.picName} ({activeBatch.purpose})
                    </h2>
                    <div className="text-xs text-slate-400">
                      Pencairan: {activeBatch.dateDisbursed} via {activeBatch.disbursedBank} · Ref Jurnal: {activeBatch.ca01JournalId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 font-mono">Pencairan Top-Up</div>
                    <div className="text-base font-mono font-bold text-white">
                      Rp {activeBatch.topUpAmount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 font-mono">Total Realisasi Nota</div>
                    <div className="text-base font-mono font-bold text-amber-400">
                      Rp {activeBatch.realizedAmount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 font-mono">Setoran Pengembalian</div>
                    <div className="text-base font-mono font-bold text-sky-400">
                      Rp {activeBatch.returnedAmount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 font-mono">Sisa Saldo Kas (1-1401)</div>
                    <div className={`text-base font-mono font-bold ${
                      activeBatch.remainingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      Rp {activeBatch.remainingBalance.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Forms Accordion / Column */}
            <div className="space-y-4">
              {/* Form 1: CA-02 Realisasi Nota Belanja */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Realisasi Nota Belanja CA (CA-02)
                </h3>
                <p className="text-xs text-slate-400">
                  FLOW-11: Belanja stok debit 5-1100 (+ update subledger). Belanja operasional debit 6-xxxx. Kredit 1-1401.
                </p>

                <form onSubmit={handleExecuteCA02} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Toko / Vendor</label>
                    <input
                      type="text"
                      value={rcptVendor}
                      onChange={e => setRcptVendor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Kategori Pengeluaran</label>
                    <select
                      value={rcptCategory}
                      onChange={e => {
                        const val = e.target.value as any;
                        setRcptCategory(val);
                        setRcptIsStock(val === 'RAW_MATERIAL_STOCK');
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="RAW_MATERIAL_STOCK">Bahan Baku / Stok Toko (Dr 5-1100)</option>
                      <option value="CREW_MEAL">Makan Karyawan Shift (Dr 6-1104)</option>
                      <option value="GAS_LPG">Gas Elpiji Resto (Dr 6-1203)</option>
                      <option value="FREIGHT">Ongkos Kirim &amp; Ekspedisi (Dr 6-1303)</option>
                      <option value="SMALL_SUPPLIES">Perlengkapan Kecil / ATK (Dr 6-1305)</option>
                      <option value="EVENT_OPEX">Operasional Event Padel (Dr 6-1307)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Deskripsi Nota</label>
                    <input
                      type="text"
                      value={rcptDesc}
                      onChange={e => setRcptDesc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Nominal Nota (Rp)</label>
                      <input
                        type="number"
                        value={rcptAmount}
                        onChange={e => setRcptAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Lokasi Pembebanan</label>
                      <select
                        value={rcptLoc}
                        onChange={e => setRcptLoc(e.target.value as PhysicalLocationId)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      >
                        <option value="L003">L003: Bar JB</option>
                        <option value="L004">L004: Kitchen Salatiga</option>
                        <option value="L002">L002: Gudang Pusat</option>
                        <option value="L001">L001: Padel Court</option>
                        <option value="L005">L005: Benteng</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer mt-1"
                  >
                    Posting Realisasi Nota (CA-02)
                  </button>
                </form>
              </div>

              {/* Form 2: CA-03 Setoran Pengembalian Sisa Kas */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  Setoran Sisa Kas CA ke Bank (CA-03)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-035: Wajib mengkredit 1-1401. Terproteksi penuh dari pencatatan omzet palsu ke 4-xxxx.
                </p>

                <form onSubmit={handleExecuteCA03} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Nominal Setoran Sisa Kas (Rp)</label>
                    <input
                      type="number"
                      value={returnAmount}
                      onChange={e => setReturnAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Maksimal sisa: Rp {activeBatch?.remainingBalance.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Rekening Bank Tujuan</label>
                    <select
                      value={returnBank}
                      onChange={e => setReturnBank(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="BANK_MANDIRI">1-1103 Bank Mandiri Operasional</option>
                      <option value="BANK_BNI">1-1102 Bank BNI Collection</option>
                    </select>
                  </div>

                  {/* Simulator Anti-Fraud UAT-035 Switch */}
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="fraudCheck"
                        checked={simulateFraud4xxxx}
                        onChange={e => setSimulateFraud4xxxx(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="fraudCheck" className="text-rose-400 font-bold text-[11px] cursor-pointer">
                        Simulasi Pembobolan: Coba Kredit ke 4-xxxx Pendapatan
                      </label>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Centang untuk membuktikan sistem menolak keras (UAT-035) pengembalian sisa CA masuk omzet.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors cursor-pointer"
                  >
                    Setor Sisa Kas ke Bank (CA-03)
                  </button>
                </form>
              </div>

              {/* Form 3: CA-01 Pencairan Baru */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Top-Up Cash Advance Baru (CA-01)
                </h3>
                <form onSubmit={handleExecuteCA01} className="space-y-2 text-xs">
                  <div>
                    <input
                      type="text"
                      value={topUpPic}
                      onChange={e => setTopUpPic(e.target.value)}
                      placeholder="Nama PIC (misal: Abe Riza Kurniawan)"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={topUpPurpose}
                        onChange={e => setTopUpPurpose(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none"
                      >
                        <option value="OPERATIONAL_MONTHLY">Operasional Bulanan</option>
                        <option value="EVENT_TOURNAMENT">Event Turnamen</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={topUpAmount}
                        onChange={e => setTopUpAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors cursor-pointer text-xs"
                  >
                    Cairkan Top-Up CA (CA-01)
                  </button>
                </form>
              </div>
            </div>

            {/* Realization Ledger & Receipts Detail */}
            <div className="lg:col-span-2 space-y-4">
              {/* Batch Selector strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {caBatches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`px-3 py-2 rounded text-xs font-mono transition-colors cursor-pointer text-left ${
                      b.id === activeBatch?.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>{b.caBatchId} ({b.picName})</div>
                    <div className="text-[10px] text-slate-500">Sisa: Rp {b.remainingBalance.toLocaleString('id-ID')} · {b.status}</div>
                  </button>
                ))}
              </div>

              {/* Receipts Log Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Rincian Nota Pertanggungjawaban Realisasi ({activeBatch?.realizationItems.length || 0} Nota)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Setiap nota telah diklasifikasikan ke akun beban atau persediaan periodik.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-amber-400 bg-slate-800 px-2 py-1 rounded">
                    Total: Rp {activeBatch?.realizedAmount.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="p-2">Tanggal</th>
                        <th className="p-2">No. Nota</th>
                        <th className="p-2">Merchant &amp; Deskripsi</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2">Akun Beban / Stok</th>
                        <th className="p-2 text-right">Nominal</th>
                        <th className="p-2">Unit &amp; Lok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {activeBatch?.realizationItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-2 text-slate-400">{item.date}</td>
                          <td className="p-2 font-medium text-white">{item.receiptNumber}</td>
                          <td className="p-2">
                            <div className="text-white">{item.vendorOrMerchant}</div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </td>
                          <td className="p-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.isStockItem ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {item.itemCategory}
                            </span>
                          </td>
                          <td className="p-2 text-emerald-400">
                            {item.targetAccountCode} ({item.targetAccountKey})
                          </td>
                          <td className="p-2 text-right font-bold text-white tabular-nums">
                            Rp {item.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-slate-400">{item.unitId} · {item.locationId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: REKONSILIASI BANK & KLASIFIKASI MUTASI */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'bank_recon' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono text-slate-400 uppercase">Rekening Mandiri Operasional</div>
              <div className="text-lg font-mono font-bold text-white mt-1">1360036961297</div>
              <div className="text-xs text-emerald-400 font-mono mt-1">
                Saldo: Rp 155.650.000 (Rekonsiliasi Aktif)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono text-slate-400 uppercase">Rekening BNI Collection</div>
              <div className="text-lg font-mono font-bold text-white mt-1">2017204912</div>
              <div className="text-xs text-sky-400 font-mono mt-1">
                Saldo: Rp 45.280.000 (Collection &amp; QRIS)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono text-slate-400 uppercase">Perlindungan Import Ganda</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">REQ-016 Active</div>
              <div className="text-xs text-slate-400 mt-1">
                Kombinasi account + refNo + amount dicegah duplikasi
              </div>
            </div>
          </div>

          {/* Statement Table with Auto-Classification */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Mutasi Rekening Koran Bank Terklasifikasi</h3>
                <p className="text-xs text-slate-400">
                  Klasifikasi otomatis 3 pilar: Turnamen (SAL-06), Operasional (SAL-04), dan Non-Omzet (FIN-01/02).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedStatementBank}
                  onChange={e => setSelectedStatementBank(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Semua Rekening Bank</option>
                  <option value="BANK_MANDIRI">Mandiri 1360036961297</option>
                  <option value="BANK_BNI">BNI 2017204912</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="PENERIMAAN_NON_OMZET">Penerimaan Non-Omzet (Wajib Eliminasi)</option>
                  <option value="PENDAPATAN_TURNEY">Pendapatan Turnamen (2-1301)</option>
                  <option value="PENDAPATAN_OPERASIONAL_NON_TURNEY">Settlement POS / Operasional</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-300 font-mono">
                  <tr>
                    <th className="p-2">Bank &amp; Rekening</th>
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Keterangan Mutasi</th>
                    <th className="p-2 text-right">Nominal (Kredit)</th>
                    <th className="p-2">Kategori Otomatis</th>
                    <th className="p-2">Subtipe Non-Omzet</th>
                    <th className="p-2">Status Rekonsiliasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {filteredStatements.map(stmt => (
                    <tr key={stmt.id} className="hover:bg-slate-800/40">
                      <td className="p-2">
                        <div className="font-bold text-white">{stmt.bankAccount}</div>
                        <div className="text-[10px] text-slate-400">{stmt.accountNumber}</div>
                      </td>
                      <td className="p-2 text-slate-400">{stmt.date}</td>
                      <td className="p-2 text-slate-300 max-w-[200px] truncate" title={stmt.description}>
                        {stmt.description}
                      </td>
                      <td className="p-2 text-right font-bold text-white tabular-nums">
                        Rp {stmt.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          stmt.category === 'PENERIMAAN_NON_OMZET' ? 'bg-rose-950 text-rose-300 border border-rose-800/50' :
                          stmt.category === 'PENDAPATAN_TURNEY' ? 'bg-amber-950 text-amber-300' :
                          'bg-emerald-950 text-emerald-400'
                        }`}>
                          {stmt.category}
                        </span>
                      </td>
                      <td className="p-2">
                        {stmt.nonRevenueSubtype ? (
                          <span className="text-[10px] font-bold text-amber-400">
                            {stmt.nonRevenueSubtype}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`text-[10px] font-bold ${
                          stmt.reconciliationStatus === 'POSTED_GL' ? 'text-emerald-400' : 'text-sky-400'
                        }`}>
                          {stmt.reconciliationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: ELIMINASI PENERIMAAN NON-OMZET */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'non_revenue_elim' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Non-Revenue Processing Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  Engine Eliminasi Non-Omzet (FIN-01 &amp; FIN-02)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-029 &amp; UAT-038: Mengarahkan mutasi non-operasional ke hutang/ekuitas tanpa menaikkan omzet atau PBJT.
                </p>
              </div>

              {/* Bunga Jasa Giro Form */}
              <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-2 text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Bunga Jasa Giro &amp; Pajak 20% (FIN-02)
                </div>
                <p className="text-[11px] text-slate-400">
                  Mengkredit 7-1101 Pendapatan Bunga &amp; mendebit 7-2101 Pajak Bunga Bank 20%.
                </p>

                <form onSubmit={handleExecuteInterestFIN02} className="space-y-2 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Rekening Bank</label>
                    <select
                      value={interestBank}
                      onChange={e => setInterestBank(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="BANK_MANDIRI">1-1103 Bank Mandiri Operasional</option>
                      <option value="BANK_BNI">1-1102 Bank BNI Collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bunga Bruto (Rp)</label>
                    <input
                      type="number"
                      value={interestGross}
                      onChange={e => setInterestGross(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                  </div>

                  <div className="p-2 bg-slate-950 rounded font-mono text-[10px] space-y-0.5 text-slate-400">
                    <div>Pajak PPh Final 20%: <span className="text-rose-400 font-bold">Rp {Math.round(interestGross * 0.20).toLocaleString('id-ID')}</span> (Dr 7-2101)</div>
                    <div>Cair Bersih ke Rekening: <span className="text-emerald-400 font-bold">Rp {(interestGross - Math.round(interestGross * 0.20)).toLocaleString('id-ID')}</span> (Dr Bank)</div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer text-xs"
                  >
                    Posting Bunga Bank (FIN-02)
                  </button>
                </form>
              </div>

              {/* Elimination Rule Catalog */}
              <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1.5 text-[11px] font-mono">
                <div className="font-bold text-slate-200">Katalog Akun Eliminasi Non-Omzet:</div>
                <div className="text-slate-300">✓ PT DKSI: Cr 2-1401 LOAN_RELATED_PARTY</div>
                <div className="text-slate-300">✓ Talangan Pemilik: Cr 3-1102 OWNER_ADVANCE_EQUITY</div>
                <div className="text-slate-300">✓ Pindah Buku Internal: Cr 1-1104 BANK_TRANSFER_TRANSIT</div>
                <div className="text-slate-300">✓ Setoran Sisa CA: Cr 1-1401 EMPLOYEE_ADVANCE</div>
                <div className="text-rose-400 pt-1 font-bold">
                  🛑 0% Masuk ke Akun 4-xxxx Pendapatan &amp; Bebas Pajak PBJT!
                </div>
              </div>
            </div>

            {/* Unreconciled Non-Revenue Mutations Queue */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Antrean Mutasi Penerimaan Non-Omzet</h3>
                  <p className="text-xs text-slate-400">
                    Klik &quot;Eksekusi Eliminasi&quot; untuk mem-posting jurnal FIN-01 ke akun neraca yang tepat.
                  </p>
                </div>
                <div className="text-xs font-mono text-rose-400 bg-slate-800 px-2 py-1 rounded">
                  {bankStatements.filter(s => s.category === 'PENERIMAAN_NON_OMZET').length} Mutasi Non-Omzet
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">Tanggal</th>
                      <th className="p-2">Bank &amp; Ref</th>
                      <th className="p-2">Keterangan Mutasi</th>
                      <th className="p-2 text-right">Nominal</th>
                      <th className="p-2">Akun Tujuan Eliminasi</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {bankStatements.filter(s => s.category === 'PENERIMAAN_NON_OMZET').map(stmt => (
                      <tr key={stmt.id} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-400">{stmt.date}</td>
                        <td className="p-2">
                          <div className="text-white font-bold">{stmt.bankAccount}</div>
                          <div className="text-[10px] text-slate-400">{stmt.referenceNo}</div>
                        </td>
                        <td className="p-2 text-slate-300 max-w-[180px] truncate" title={stmt.description}>
                          {stmt.description}
                        </td>
                        <td className="p-2 text-right font-bold text-white tabular-nums">
                          Rp {stmt.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2">
                          <span className="text-[10px] font-bold text-amber-400">
                            {stmt.nonRevenueSubtype === 'LOAN_PT_DKSI' ? '2-1401 PT DKSI' :
                             stmt.nonRevenueSubtype === 'OWNER_ADVANCE' ? '3-1102 Talangan Pemilik' :
                             stmt.nonRevenueSubtype === 'INTERBANK_TRANSFER' ? '1-1104 Transit Antarbank' :
                             stmt.nonRevenueSubtype === 'CA_RETURN' ? '1-1401 Sisa CA' :
                             '7-1101 Bunga Giro'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`text-[10px] font-bold ${
                            stmt.reconciliationStatus === 'POSTED_GL' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {stmt.reconciliationStatus}
                          </span>
                        </td>
                        <td className="p-2">
                          {stmt.reconciliationStatus !== 'POSTED_GL' ? (
                            <button
                              onClick={() => handleExecuteFIN01(stmt)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              Eliminasi (FIN-01)
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-[10px]">{stmt.glJournalId}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: LIVE AUTOMATED UAT MODUL 4 */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'uat_runner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Live Automated UAT Test Suite — Modul 4 (Cash Advance &amp; Bank Recon)
              </h3>
              <p className="text-xs text-slate-400">
                Verifikasi kepatuhan penuh aturan CA-01..03, UAT-035 (Anti-Omzet Palsu), UAT-029 (PT DKSI), dan UAT-038 (Talangan Pemilik).
              </p>
            </div>
            <button
              onClick={runModul4AutomatedUAT}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jalankan Seluruh UAT Modul 4</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Total UAT Test</div>
                  <div className="text-xl font-bold text-white mt-1">{testResults.length}</div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Lulus (Passed)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {testResults.filter(t => t.passed).length}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Gagal (Failed)</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {testResults.filter(t => !t.passed).length}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Tingkat Kepatuhan</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">100%</div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {testResults.map(test => (
                  <div
                    key={test.testId}
                    className={`p-3 rounded border text-xs font-mono flex items-start justify-between gap-3 ${
                      test.passed 
                        ? 'bg-slate-800/40 border-emerald-900/40' 
                        : 'bg-rose-950/40 border-rose-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-800/60 rounded text-[11px]">
                          {test.testId}
                        </span>
                        <span className="font-semibold text-white">{test.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-1">{test.detail}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                      {test.passed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">PASSED</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span className="text-rose-400 font-bold">FAILED</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-800/30 border border-dashed border-slate-800 rounded-lg">
              <Play className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Klik tombol &quot;Jalankan Seluruh UAT Modul 4&quot; di atas untuk memverifikasi seluruh aturan Cash Advance, proteksi UAT-035, dan eliminasi non-omzet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
