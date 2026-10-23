/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 4: Bank Reconciliation & Non-Revenue Elimination Engine (FIN-01, FIN-02)
 * 
 * Strict Blueprint Compliance:
 * - REQ-016: Rekonsiliasi Bank BNI (2017204912) & Mandiri (1360036961297) dengan pencegahan import ganda.
 * - REQ-040 / UAT-029 / UAT-038: Eliminasi Penerimaan Non-Omzet (Pinjaman DKSI 2-1401, Talangan Pemilik 3-1102, Pindah Buku 1-1104, Bunga Bank 7-1101).
 */

import { 
  BankStatementLine, 
  BankMutationCategory, 
  NonRevenueSubtype, 
  NonRevenuePostingResult 
} from '../types/cashAdvanceAndBanking';
import { BusinessUnitId, PhysicalLocationId, CoreGLJournalPayload } from '../types/module1';
import { GLJournalEntry } from '../types/erp';
import { executeCoreGLPosting } from './coreGlEngine';

/**
 * Classifies bank mutation automatically based on narrative, provider keywords, and tariff values
 */
export function classifyBankMutation(
  desc: string,
  amount: number,
  mutationType: 'CR' | 'DB'
): { category: BankMutationCategory; subtype?: NonRevenueSubtype } {
  if (mutationType === 'DB') {
    return { category: 'PENGELUARAN_OPERASIONAL' };
  }

  const d = desc.toLowerCase();

  // 1. Check Non-Revenue Subtypes first (Strict Anti-Fraud)
  if (d.includes('dksi') || d.includes('pt dksi') || d.includes('pinjaman berelasi')) {
    return { category: 'PENERIMAAN_NON_OMZET', subtype: 'LOAN_PT_DKSI' };
  }

  if (d.includes('talangan') || d.includes('setoran pemilik') || d.includes('owner funding') || d.includes('suntikan modal')) {
    return { category: 'PENERIMAAN_NON_OMZET', subtype: 'OWNER_ADVANCE' };
  }

  if (d.includes('pindah buku') || d.includes('overbooking') || d.includes('trf bni') || d.includes('trf mandiri') || d.includes('transit antarbank')) {
    return { category: 'PENERIMAAN_NON_OMZET', subtype: 'INTERBANK_TRANSFER' };
  }

  if (d.includes('bunga jasa giro') || d.includes('interest credit') || d.includes('bunga giro')) {
    return { category: 'PENERIMAAN_NON_OMZET', subtype: 'BANK_INTEREST' };
  }

  if (d.includes('sisa ca') || d.includes('pengembalian ca') || d.includes('abe riza')) {
    return { category: 'PENERIMAAN_NON_OMZET', subtype: 'CA_RETURN' };
  }

  // 2. Check Tournament Prepayments (SAL-06)
  if (
    amount === 500000 || 
    amount === 550000 || 
    amount === 650000 || 
    amount === 800000 || 
    d.includes('turnamen') || 
    d.includes('turney') || 
    d.includes('championship')
  ) {
    return { category: 'PENDAPATAN_TURNEY' };
  }

  // 3. Check Operating Settlement / POS (SAL-04 / SAL-01)
  if (
    d.includes('qris') || 
    d.includes('edc') || 
    d.includes('ayo') || 
    d.includes('livin') || 
    d.includes('settlement') || 
    d.includes('sewa court') || 
    d.includes('booking')
  ) {
    return { category: 'PENDAPATAN_OPERASIONAL_NON_TURNEY' };
  }

  return { category: 'UNKNOWN' };
}

/**
 * Import bank statement line with anti-duplicate prevention (REQ-016)
 */
export function importBankStatementLines(
  rawLines: Array<{
    bankAccount: 'BANK_BNI' | 'BANK_MANDIRI';
    accountNumber: '2017204912' | '1360036961297';
    date: string;
    description: string;
    mutationType: 'CR' | 'DB';
    amount: number;
    balanceAfter: number;
    referenceNo: string;
  }>,
  existingLines: BankStatementLine[]
): { newLines: BankStatementLine[]; skippedDuplicatesCount: number } {
  let skippedDuplicatesCount = 0;
  const newLines: BankStatementLine[] = [];

  for (const raw of rawLines) {
    const isDuplicate = existingLines.some(
      ex => ex.accountNumber === raw.accountNumber && 
            ex.referenceNo === raw.referenceNo &&
            ex.amount === raw.amount &&
            ex.date === raw.date
    );

    if (isDuplicate) {
      skippedDuplicatesCount++;
      continue;
    }

    const classification = classifyBankMutation(raw.description, raw.amount, raw.mutationType);

    const statementLine: BankStatementLine = {
      id: `stmt-${raw.accountNumber}-${Date.now()}-${newLines.length}`,
      bankAccount: raw.bankAccount,
      accountNumber: raw.accountNumber,
      date: raw.date,
      description: raw.description,
      mutationType: raw.mutationType,
      amount: raw.amount,
      balanceAfter: raw.balanceAfter,
      referenceNo: raw.referenceNo,
      category: classification.category,
      nonRevenueSubtype: classification.subtype,
      reconciliationStatus: 'UNRECONCILED',
      isEliminatedFromRevenue: classification.category === 'PENERIMAAN_NON_OMZET'
    };

    newLines.push(statementLine);
  }

  return { newLines, skippedDuplicatesCount };
}

/**
 * FIN-01: Eksekusi Eliminasi Mutasi Kredit Non-Omzet (UAT-029, UAT-038)
 * - Pinjaman PT DKSI: Dr 1-1103 Mandiri / Cr 2-1401 LOAN_RELATED_PARTY (UAT-029)
 * - Talangan Pemilik: Dr 1-1103 Mandiri / Cr 3-1102 OWNER_ADVANCE_EQUITY (UAT-038)
 * - Pindah Buku Internal: Dr 1-1103 Mandiri / Cr 1-1104 BANK_TRANSFER_TRANSIT
 */
export function executePostNonRevenueFIN01(params: {
  statementLine: BankStatementLine;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): NonRevenuePostingResult {
  const { statementLine, makerUserId, existingJournals, nextJournalNumber } = params;

  let creditAccountKey = 'LOAN_RELATED_PARTY'; // default 2-1401
  let descriptionText = '';

  switch (statementLine.nonRevenueSubtype) {
    case 'LOAN_PT_DKSI':
      creditAccountKey = 'LOAN_RELATED_PARTY'; // 2-1401
      descriptionText = `FIN-01: Penerimaan Pinjaman Afiliasi PT DKSI (Non-Omzet / UAT-029)`;
      break;
    case 'OWNER_ADVANCE':
      creditAccountKey = 'OWNER_ADVANCE_EQUITY'; // 3-1102
      descriptionText = `FIN-01: Penerimaan Talangan Modal Pemilik (Non-Omzet / UAT-038)`;
      break;
    case 'INTERBANK_TRANSFER':
      creditAccountKey = 'BANK_TRANSFER_TRANSIT'; // 1-1104
      descriptionText = `FIN-01: Pindah Buku Internal Antar Rekening (Transit 1-1104 Net Rp 0)`;
      break;
    case 'CA_RETURN':
      creditAccountKey = 'EMPLOYEE_ADVANCE'; // 1-1401
      descriptionText = `CA-03: Setoran Pengembalian Sisa Cash Advance (Non-Omzet / UAT-035)`;
      break;
    default:
      return {
        success: false,
        ruleCode: 'FIN-01',
        statementLineId: statementLine.id,
        creditAccountKey: '',
        creditAccountCode: '',
        amount: statementLine.amount,
        error: `Subtipe non-omzet '${statementLine.nonRevenueSubtype}' tidak didukung untuk FIN-01.`
      };
  }

  // STRICT ASSERTION: Prevent any revenue account from being credited!
  if (creditAccountKey.startsWith('REV_') || creditAccountKey.startsWith('4-')) {
    return {
      success: false,
      ruleCode: 'FIN-01',
      statementLineId: statementLine.id,
      creditAccountKey,
      creditAccountCode: '',
      amount: statementLine.amount,
      error: `[UAT-029/038 Violation]: Akun kredit '${creditAccountKey}' terindikasi akun omzet! Penerimaan non-omzet dilarang masuk ke 4-xxxx.`
    };
  }

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: statementLine.id,
    sourceDocNo: statementLine.referenceNo,
    ruleCode: 'FIN-01',
    date: statementLine.date,
    reference: statementLine.referenceNo,
    description: descriptionText,
    lines: [
      {
        accountKey: statementLine.bankAccount, // 1-1102 (BNI) or 1-1103 (Mandiri)
        debit: statementLine.amount,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Penerimaan mutasi kredit bank rekening ${statementLine.accountNumber}`
      },
      {
        accountKey: creditAccountKey,
        debit: 0,
        credit: statementLine.amount,
        unitId: 'U009',
        locationId: 'L002',
        description: `Kredit akun non-omzet: ${creditAccountKey}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return {
      success: false,
      ruleCode: 'FIN-01',
      statementLineId: statementLine.id,
      creditAccountKey,
      creditAccountCode: '',
      amount: statementLine.amount,
      error: glRes.validation.errors.join(' | ')
    };
  }

  return {
    success: true,
    ruleCode: 'FIN-01',
    statementLineId: statementLine.id,
    glJournalId: glRes.journal.id,
    creditAccountKey,
    creditAccountCode: glRes.journal.lines[1]?.accountCode || '',
    amount: statementLine.amount
  };
}

/**
 * FIN-02: Bunga Jasa Giro Bank & Pajak Bunga 20%
 * Jurnal Inflow Bunga: Dr Bank / Cr 7-1101 Pendapatan Bunga Bank (REV_BANK_INTEREST)
 * Jurnal Pajak Bunga: Dr 7-2101 Beban Pajak Bunga Bank (20%) / Cr Bank
 */
export function executePostBankInterestFIN02(params: {
  bankAccount: 'BANK_BNI' | 'BANK_MANDIRI';
  grossInterestAmount: number;
  dateStr: string;
  referenceNo: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; glJournal?: GLJournalEntry; netReceived?: number; taxAmount?: number; error?: string } {
  const { bankAccount, grossInterestAmount, dateStr, referenceNo, makerUserId, existingJournals, nextJournalNumber } = params;

  if (grossInterestAmount <= 0) {
    return { success: false, error: 'Nominal bunga jasa giro harus lebih besar dari Rp 0.' };
  }

  const taxWithholdingRate = 0.20; // 20% PPh Final Bunga Bank
  const taxAmount = Math.round(grossInterestAmount * taxWithholdingRate);
  const netReceived = grossInterestAmount - taxAmount;

  // Single compound journal for FIN-02:
  // Dr Bank (net received)
  // Dr 7-2101 Pajak Bunga Bank (REV_BANK_INTEREST debit context -> 7-2101)
  // Cr 7-1101 Pendapatan Bunga Bank (REV_BANK_INTEREST credit context -> 7-1101)
  const glPayload: CoreGLJournalPayload = {
    sourceEventId: `INT-${Date.now()}`,
    sourceDocNo: referenceNo,
    ruleCode: 'FIN-02',
    date: dateStr,
    reference: referenceNo,
    description: `FIN-02: Pendapatan Bunga Jasa Giro (${grossInterestAmount.toLocaleString('id-ID')}) & Pemotongan PPh Final 20% (${taxAmount.toLocaleString('id-ID')})`,
    lines: [
      {
        accountKey: bankAccount,
        debit: netReceived,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Penerimaan bunga jasa giro neto setelah pajak 20%`
      },
      {
        accountKey: 'REV_BANK_INTEREST', // context debit -> 7-2101
        debit: taxAmount,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Beban PPh Final 20% atas bunga giro perbankan`
      },
      {
        accountKey: 'REV_BANK_INTEREST', // context credit -> 7-1101
        debit: 0,
        credit: grossInterestAmount,
        unitId: 'U009',
        locationId: 'L002',
        description: `Pendapatan bunga jasa giro bank ${bankAccount}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  return {
    success: true,
    glJournal: glRes.journal,
    netReceived,
    taxAmount
  };
}
