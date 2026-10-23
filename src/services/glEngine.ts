/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Single General Ledger (GL) Engine & Invariant Validator
 */

import { GLJournalEntry, GLJournalLine, BusinessUnitId, PhysicalLocationId } from '../types/erp';
import { ACCOUNT_KEYS, getAccountByCode, getAccountByKey } from '../constants/coaData';

export interface PostJournalPayload {
  ruleCode: string; // e.g. 'GR-01', 'AP-01', 'SAL-01', 'SAL-06', 'SAL-07', 'STK-07', 'CA-03', 'FIN-01', 'MANUAL'
  date: string;
  reference: string;
  description: string;
  idempotencyKey: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    unitId: BusinessUnitId;
    locationId?: PhysicalLocationId;
    description: string;
  }>;
  createdBy: string;
  approvedBy?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates General Ledger Journal integrity against Padel Beans Blueprint rules:
 * 1. Balanced: Sum(Debit) == Sum(Credit)
 * 2. Immutable idempotency check
 * 3. Anti-Fake-Revenue Rules:
 *    - CA-03 (Cash advance return) cannot credit 4-xxxx
 *    - FIN-01 (PT DKSI loan) cannot credit 4-xxxx
 *    - FIN-02 (Owner funding) cannot credit 4-xxxx
 *    - FIN-03 (Bank transfer) cannot credit 4-xxxx
 *    - SAL-06 (Tournament deposit) must credit 2-1301, not 4-1102
 * 4. Periodic Inventory Compliance:
 *    - STK-06 is forbidden (perpetual COGS blocked)
 *    - GR-01 must debit 5-1100 and credit 2-1104 (GRNI)
 * 5. Mandatory Business Unit on all lines
 */
export function validateJournalEntry(
  payload: PostJournalPayload, 
  existingJournals: GLJournalEntry[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Idempotency Check
  const isDuplicate = existingJournals.some(
    j => j.idempotencyKey === payload.idempotencyKey && j.status !== 'REVERSED'
  );
  if (isDuplicate) {
    errors.push(`Idempotency Violation: Journal with key '${payload.idempotencyKey}' already exists.`);
  }

  // 2. Lines presence
  if (!payload.lines || payload.lines.length < 2) {
    errors.push('Journal must contain at least 2 lines (Double Entry requirement).');
    return { isValid: false, errors, warnings };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < payload.lines.length; i++) {
    const line = payload.lines[i];
    const acc = getAccountByCode(line.accountCode);

    if (!acc) {
      errors.push(`Line ${i + 1}: Account code '${line.accountCode}' does not exist in COA.`);
    }

    if (!line.unitId) {
      errors.push(`Line ${i + 1}: Dimensi Unit Bisnis (U001, U002, U003, U009) is mandatory.`);
    }

    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Line ${i + 1}: Negative amounts are not allowed in double-entry lines.`);
    }

    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Line ${i + 1}: A line cannot have both Debit and Credit amounts simultaneously.`);
    }

    totalDebit += Number(line.debit) || 0;
    totalCredit += Number(line.credit) || 0;

    // Hard Rule: Anti-Fake-Revenue Checks
    if (line.accountCode.startsWith('4-')) {
      if (payload.ruleCode === 'CA-03') {
        errors.push(`CRITICAL ANTI-FRAUD: Cash Advance Return (CA-03) cannot credit Revenue account ${line.accountCode}. Must credit 1-1401.`);
      }
      if (payload.ruleCode === 'FIN-01') {
        errors.push(`CRITICAL ANTI-FRAUD: Related Party Loan PT DKSI (FIN-01) cannot credit Revenue account ${line.accountCode}. Must credit 2-1401.`);
      }
      if (payload.ruleCode === 'FIN-02') {
        errors.push(`CRITICAL ANTI-FRAUD: Owner Funding/Talangan (FIN-02) cannot credit Revenue account ${line.accountCode}. Must credit 3-1102.`);
      }
      if (payload.ruleCode === 'FIN-03') {
        errors.push(`CRITICAL ANTI-FRAUD: Interbank transfer cannot credit Revenue account ${line.accountCode}.`);
      }
      if (payload.ruleCode === 'SAL-06') {
        errors.push(`CRITICAL ANTI-FRAUD: Tournament advance registration (SAL-06) cannot credit Revenue account ${line.accountCode}. Must credit 2-1301.`);
      }
    }
  }

  // 3. Balance verification (rounded to 2 decimal places)
  const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100)) / 100;
  if (diff > 0.01) {
    errors.push(`Balance Violation: Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) does not match Total Credit (Rp ${totalCredit.toLocaleString('id-ID')}). Variance: Rp ${diff.toLocaleString('id-ID')}`);
  }

  // 4. Perpetual COGS Prohibition Check (Rule STK-06)
  if (payload.ruleCode === 'STK-06') {
    errors.push('CRITICAL CONSTRAINT: Rule STK-06 (Perpetual COGS per POS Transaction) is HARD-DISABLED in Padel Beans ERP. Periodic HPP method is enforced.');
  }

  // 5. GR-01 Periodic Invariant: Must use 5-1100, not 1-1301..1-1305
  if (payload.ruleCode === 'GR-01') {
    const hasInventoryAssetDebit = payload.lines.some(
      l => l.debit > 0 && l.accountCode.startsWith('1-13')
    );
    if (hasInventoryAssetDebit) {
      errors.push('Periodic Rule GR-01 Violation: Inbound Goods Receipt must debit 5-1100 (Pembelian Persediaan Periodik), NEVER asset 1-1301..1-1305.');
    }
    const hasGrniCredit = payload.lines.some(
      l => l.credit > 0 && l.accountCode === ACCOUNT_KEYS.GRNI
    );
    if (!hasGrniCredit) {
      warnings.push(`Standard GR-01 posting expects credit to 2-1104 (${ACCOUNT_KEYS.GRNI} GRNI).`);
    }
  }

  // 6. Segregation of Duties Check
  if (payload.approvedBy && payload.createdBy && payload.approvedBy === payload.createdBy) {
    warnings.push('Segregation of Duties Note: Creator and Approver are the same user.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Creates a balanced, immutable GL journal entry
 */
export function createJournalEntry(
  payload: PostJournalPayload,
  nextJournalNumber: string
): GLJournalEntry {
  const journalId = `jnl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let totalDebit = 0;
  let totalCredit = 0;

  const lines: GLJournalLine[] = payload.lines.map((l, index) => {
    const acc = getAccountByCode(l.accountCode);
    const debit = Number(l.debit) || 0;
    const credit = Number(l.credit) || 0;
    totalDebit += debit;
    totalCredit += credit;

    return {
      id: `${journalId}-line-${index + 1}`,
      journalId,
      accountCode: l.accountCode,
      accountKey: acc?.accountKey || 'UNKNOWN',
      accountName: acc?.accountName || 'Unknown Account',
      debit,
      credit,
      unitId: l.unitId,
      locationId: l.locationId,
      description: l.description || payload.description
    };
  });

  return {
    id: journalId,
    journalNumber: nextJournalNumber,
    date: payload.date,
    ruleCode: payload.ruleCode,
    reference: payload.reference,
    description: payload.description,
    idempotencyKey: payload.idempotencyKey,
    status: 'POSTED',
    lines,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    createdAt: new Date().toISOString(),
    createdBy: payload.createdBy,
    approvedBy: payload.approvedBy
  };
}

/**
 * Generates an immutable Reversal Journal for an existing journal entry
 */
export function createReversalJournal(
  originalJournal: GLJournalEntry,
  reversalReason: string,
  reversalBy: string,
  nextJournalNumber: string
): GLJournalEntry {
  const reversalId = `jnl-rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  // Invert Debit and Credit exactly
  const lines: GLJournalLine[] = originalJournal.lines.map((l, index) => ({
    id: `${reversalId}-line-${index + 1}`,
    journalId: reversalId,
    accountCode: l.accountCode,
    accountKey: l.accountKey,
    accountName: l.accountName,
    debit: l.credit, // Inverted
    credit: l.debit, // Inverted
    unitId: l.unitId,
    locationId: l.locationId,
    description: `Reversal of ${originalJournal.journalNumber}: ${reversalReason}`
  }));

  return {
    id: reversalId,
    journalNumber: nextJournalNumber,
    date: dateStr,
    ruleCode: `REV-${originalJournal.ruleCode}`,
    reference: `REV-${originalJournal.journalNumber}`,
    description: `[REVERSAL] ${reversalReason} (Ref: ${originalJournal.journalNumber})`,
    idempotencyKey: `idemp-rev-${originalJournal.id}`,
    status: 'POSTED',
    lines,
    totalDebit: originalJournal.totalCredit,
    totalCredit: originalJournal.totalDebit,
    isBalanced: true,
    isReversal: true,
    reversalOfJournalId: originalJournal.id,
    createdAt: new Date().toISOString(),
    createdBy: reversalBy,
    approvedBy: reversalBy
  };
}
