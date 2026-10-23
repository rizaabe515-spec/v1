/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Core Double-Entry General Ledger (GL) Posting Engine
 * 
 * Enforces:
 * - REQ-023 / UAT-003: Total Debit == Total Kredit (Zero Tolerance)
 * - REQ-024 / UAT-004: Idempotency Check (sourceEventId + sourceDocNo)
 * - REQ-025 / UAT-031: Validasi Periode Akuntansi Terbuka (Closed Period Protection)
 * - REQ-026 / UAT-033: Mandatory Dimensi Unit Bisnis & Lokasi Fisik
 * - REQ-027 / UAT-002: Segregation of Duties (Maker != Approver)
 * - REQ-028 / UAT-005: Append-Only Immutability & Linked Reversal Engine
 * - G-11: Blocking Exception on unmapped / inactive AccountKeys
 */

import { 
  CoreGLJournalPayload, 
  CoreGLLinePayload, 
  JournalValidationResult,
  BusinessUnitId,
  PhysicalLocationId
} from '../types/module1';
import { GLJournalEntry, GLJournalLine } from '../types/erp';
import { resolveAccount, resolveCodeToKey, BlockingAccountException } from './accountResolver';
import { assertSegregationOfDuties } from './rbacService';
import { accountingPeriodManager } from './accountingPeriodService';
import { MASTER_UNIT_MAP, MASTER_LOCATION_MAP } from '../constants/masterDimensions';

export interface ProcessedGLPostingResult {
  success: boolean;
  journal?: GLJournalEntry;
  validation: JournalValidationResult;
  idempotencyKey: string;
}

/**
 * Validates journal payload against all strict Blueprint constraints
 */
export function validateCoreGLPayload(
  payload: CoreGLJournalPayload,
  existingJournals: GLJournalEntry[]
): JournalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const idempotencyKey = `IDEMP-${payload.sourceEventId}-${payload.sourceDocNo}`;

  // 1. REQ-024 / UAT-004: Idempotency Check
  const isDuplicate = existingJournals.some(
    j => j.idempotencyKey === idempotencyKey && j.status !== 'REVERSED'
  );
  if (isDuplicate) {
    errors.push(
      `[UAT-004 Idempotency Violation] Transaksi ganda terdeteksi! Jurnal dengan Event ID '${payload.sourceEventId}' dan Doc No '${payload.sourceDocNo}' sudah terposting dalam sistem.`
    );
  }

  // 2. REQ-025 / UAT-031: Closed Accounting Period Protection
  try {
    accountingPeriodManager.assertPeriodIsOpen(payload.date);
  } catch (err: any) {
    errors.push(err.message || 'Periode akuntansi terkunci.');
  }

  // 3. REQ-027 / UAT-002: Segregation of Duties Check
  if (payload.requiresApproval || payload.approverUserId) {
    try {
      assertSegregationOfDuties(payload.makerUserId, payload.approverUserId);
    } catch (err: any) {
      errors.push(err.message || 'Pelanggaran Segregation of Duties.');
    }
  }

  // 4. Lines Presence & Double Entry Structure
  if (!payload.lines || payload.lines.length < 2) {
    errors.push('Jurnal wajib memiliki minimal 2 baris transaksi (Prinsip Double-Entry).');
    return {
      isValid: false,
      errors,
      warnings,
      ruleCode: payload.ruleCode,
      balanceDiff: 0
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < payload.lines.length; i++) {
    const line = payload.lines[i];

    // AccountKey resolution & G-11 enforcement
    let resolvedCode = line.accountCode;
    let resolvedName = '';
    
    if (line.accountKey) {
      try {
        const resolved = resolveAccount(line.accountKey, {
          unitId: line.unitId,
          locationId: line.locationId,
          transactionSide: line.debit > 0 ? 'DEBIT' : 'CREDIT'
        });
        resolvedCode = resolved.accountCode;
        resolvedName = resolved.accountName;
      } catch (err: any) {
        if (err instanceof BlockingAccountException) {
          errors.push(`Baris ${i + 1}: ${err.message}`);
        } else {
          errors.push(`Baris ${i + 1}: Gagal memetakan AccountKey '${line.accountKey}': ${err.message}`);
        }
      }
    } else if (line.accountCode) {
      const coaItem = resolveCodeToKey(line.accountCode);
      if (!coaItem) {
        errors.push(`[G-11] Baris ${i + 1}: Kode akun '${line.accountCode}' tidak terdaftar dalam konfigurasi COA.`);
      }
    } else {
      errors.push(`Baris ${i + 1}: Baris transaksi wajib memiliki 'accountKey' atau 'accountCode'.`);
    }

    // REQ-026 / UAT-033: Mandatory Unit ID
    if (!line.unitId) {
      errors.push(`[UAT-033 Dimensi Error] Baris ${i + 1}: Dimensi Unit Bisnis (U001, U002, U003, U009) wajib diisi.`);
    } else if (!MASTER_UNIT_MAP.has(line.unitId)) {
      errors.push(`Baris ${i + 1}: Unit Bisnis '${line.unitId}' tidak valid.`);
    }

    // REQ-026 / UAT-033: Mandatory Location ID for stock & inventory lines
    const isStockLine = resolvedCode?.startsWith('1-13') || resolvedCode?.startsWith('5-11');
    if (isStockLine && !line.locationId) {
      errors.push(
        `[UAT-033 Dimensi Error] Baris ${i + 1}: Akun persediaan/HPP '${resolvedCode}' wajib memiliki Dimensi Lokasi Fisik (L001-L005) untuk kontrol stok subledger.`
      );
    } else if (line.locationId && !MASTER_LOCATION_MAP.has(line.locationId)) {
      errors.push(`Baris ${i + 1}: Lokasi Fisik '${line.locationId}' tidak valid.`);
    }

    // Non-negative constraint
    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Baris ${i + 1}: Nilai Debit atau Kredit tidak boleh bernilai negatif.`);
    }

    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Baris ${i + 1}: Baris jurnal tidak boleh memiliki nilai Debit dan Kredit sekaligus.`);
    }

    totalDebit += Number(line.debit) || 0;
    totalCredit += Number(line.credit) || 0;

    // Hard Rules Anti-Fake-Revenue Checks
    if (resolvedCode?.startsWith('4-')) {
      if (payload.ruleCode === 'CA-03') {
        errors.push(`CRITICAL ANTI-FRAUD: Pengembalian Cash Advance (CA-03) dilarang mengkredit akun pendapatan ${resolvedCode}. Wajib kredit 1-1401.`);
      }
      if (payload.ruleCode === 'FIN-01') {
        errors.push(`CRITICAL ANTI-FRAUD: Pinjaman Pihak Berelasi PT DKSI (FIN-01) dilarang mengkredit akun pendapatan ${resolvedCode}. Wajib kredit 2-1401.`);
      }
      if (payload.ruleCode === 'FIN-02') {
        errors.push(`CRITICAL ANTI-FRAUD: Talangan Pemilik (FIN-02) dilarang mengkredit akun pendapatan ${resolvedCode}. Wajib kredit 3-1102.`);
      }
      if (payload.ruleCode === 'FIN-03') {
        errors.push(`CRITICAL ANTI-FRAUD: Pindah buku antar-bank dilarang mengkredit akun pendapatan ${resolvedCode}.`);
      }
      if (payload.ruleCode === 'SAL-06') {
        errors.push(`CRITICAL ANTI-FRAUD: Uang muka turnamen (SAL-06) dilarang mengkredit akun pendapatan ${resolvedCode}. Wajib kredit 2-1301.`);
      }
    }
  }

  // 5. REQ-023 / UAT-003: Zero-Tolerance Balance Check (Total Debit == Total Kredit)
  const balanceDiff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100)) / 100;
  if (balanceDiff !== 0) {
    errors.push(
      `[UAT-003 Balance Error] Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) tidak sama dengan Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}). Selisih: Rp ${balanceDiff.toLocaleString('id-ID')}. Single GL mewajibkan balance mutlak (Zero-Tolerance).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    ruleCode: payload.ruleCode,
    balanceDiff
  };
}

/**
 * Core GL Posting Function
 */
export function executeCoreGLPosting(
  payload: CoreGLJournalPayload,
  existingJournals: GLJournalEntry[],
  nextJournalNumber: string
): ProcessedGLPostingResult {
  const idempotencyKey = `IDEMP-${payload.sourceEventId}-${payload.sourceDocNo}`;
  const validation = validateCoreGLPayload(payload, existingJournals);

  if (!validation.isValid) {
    return {
      success: false,
      validation,
      idempotencyKey
    };
  }

  const journalId = `jnl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let totalDebit = 0;
  let totalCredit = 0;

  const lines: GLJournalLine[] = payload.lines.map((l, index) => {
    let accCode = l.accountCode || '';
    let accKey = l.accountKey || '';
    let accName = '';

    if (l.accountKey) {
      const res = resolveAccount(l.accountKey, {
        unitId: l.unitId,
        locationId: l.locationId,
        transactionSide: l.debit > 0 ? 'DEBIT' : 'CREDIT'
      });
      accCode = res.accountCode;
      accKey = res.accountKey;
      accName = res.accountName;
    } else if (l.accountCode) {
      const coaItem = resolveCodeToKey(l.accountCode);
      accCode = l.accountCode;
      accKey = coaItem?.accountKey || 'CUSTOM';
      accName = coaItem?.accountName || 'Custom Account';
    }

    const debit = Number(l.debit) || 0;
    const credit = Number(l.credit) || 0;
    totalDebit += debit;
    totalCredit += credit;

    return {
      id: `${journalId}-line-${index + 1}`,
      journalId,
      accountCode: accCode,
      accountKey: accKey,
      accountName: accName,
      debit,
      credit,
      unitId: l.unitId,
      locationId: l.locationId,
      description: l.description || payload.description
    };
  });

  const newJournal: GLJournalEntry = {
    id: journalId,
    journalNumber: nextJournalNumber,
    date: payload.date,
    ruleCode: payload.ruleCode,
    reference: `${payload.sourceEventId} / ${payload.sourceDocNo}`,
    description: payload.description,
    idempotencyKey,
    status: 'POSTED',
    lines,
    totalDebit,
    totalCredit,
    isBalanced: true,
    createdAt: new Date().toISOString(),
    createdBy: payload.makerUserId,
    approvedBy: payload.approverUserId
  };

  return {
    success: true,
    journal: newJournal,
    validation,
    idempotencyKey
  };
}

/**
 * REQ-028 / UAT-005: Reversal Journal Generator (Append-Only Immutability)
 */
export function executeCoreGLReversal(
  targetJournal: GLJournalEntry,
  reason: string,
  actorUserId: string,
  approverUserId: string | undefined,
  nextJournalNumber: string
): { success: boolean; reversalJournal?: GLJournalEntry; error?: string } {
  if (targetJournal.status === 'REVERSED') {
    return {
      success: false,
      error: `Jurnal ${targetJournal.journalNumber} sudah berstatus REVERSED sebelumnya.`
    };
  }

  // Validate Closed Accounting Period for reversal date
  const reversalDate = new Date().toISOString().split('T')[0];
  try {
    accountingPeriodManager.assertPeriodIsOpen(reversalDate);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Enforce SoD for reversal if approver provided
  if (approverUserId) {
    try {
      assertSegregationOfDuties(actorUserId, approverUserId);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const reversalId = `jnl-rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const reversalLines: GLJournalLine[] = targetJournal.lines.map((l, index) => ({
    id: `${reversalId}-line-${index + 1}`,
    journalId: reversalId,
    accountCode: l.accountCode,
    accountKey: l.accountKey,
    accountName: l.accountName,
    debit: l.credit, // Inverted
    credit: l.debit, // Inverted
    unitId: l.unitId,
    locationId: l.locationId,
    description: `[REVERSAL OF ${targetJournal.journalNumber}] ${reason}`
  }));

  const reversalJournal: GLJournalEntry = {
    id: reversalId,
    journalNumber: nextJournalNumber,
    date: reversalDate,
    ruleCode: `REV-${targetJournal.ruleCode}`,
    reference: `REVERSAL-${targetJournal.journalNumber}`,
    description: `[KOREKSI/REVERSAL] ${reason} (Ref: ${targetJournal.journalNumber})`,
    idempotencyKey: `IDEMP-REV-${targetJournal.id}`,
    status: 'POSTED',
    lines: reversalLines,
    totalDebit: targetJournal.totalCredit,
    totalCredit: targetJournal.totalDebit,
    isBalanced: true,
    isReversal: true,
    reversalOfJournalId: targetJournal.id,
    createdAt: new Date().toISOString(),
    createdBy: actorUserId,
    approvedBy: approverUserId || actorUserId
  };

  return {
    success: true,
    reversalJournal
  };
}
