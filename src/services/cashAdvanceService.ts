/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 4: Cash Advance Engine (CA-01, CA-02, CA-03)
 * 
 * Strict Blueprint Compliance:
 * - FLOW-11 / REQ-037: Pencairan Top-Up, Realisasi Nota, & Setoran Pengembalian Sisa Kas
 * - UAT-035: Setoran sisa CA (Abe Riza Kurniawan) DILARANG masuk ke 4-xxxx Pendapatan!
 */

import { 
  CashAdvanceBatch, 
  CARealizationItem, 
  CAPurpose 
} from '../types/cashAdvanceAndBanking';
import { BusinessUnitId, PhysicalLocationId, CoreGLJournalPayload } from '../types/module1';
import { GLJournalEntry } from '../types/erp';
import { executeCoreGLPosting } from './coreGlEngine';

/**
 * CA-01: Pencairan Top-Up Cash Advance Karyawan (FLOW-11)
 * Jurnal: Dr 1-1401 EMPLOYEE_ADVANCE / Cr 1-1103 Bank Mandiri atau 1-1102 Bank BNI
 * HARD CONSTRAINT: DILARANG diakui sebagai beban saat pencairan.
 */
export function executeDisburseCA01(params: {
  picName: string;
  purpose: CAPurpose;
  topUpAmount: number;
  disbursedBank: 'BANK_MANDIRI' | 'BANK_BNI';
  dateStr: string;
  notes?: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; batch?: CashAdvanceBatch; glJournal?: GLJournalEntry; error?: string } {
  const { picName, purpose, topUpAmount, disbursedBank, dateStr, notes, makerUserId, existingJournals, nextJournalNumber } = params;

  if (topUpAmount <= 0) {
    return { success: false, error: 'Nominal top-up Cash Advance harus lebih besar dari Rp 0.' };
  }

  const batchId = `CA-${Date.now()}`;
  const caDocNo = `CA-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  // Jurnal CA-01: Dr 1-1401 / Cr Bank
  const glPayload: CoreGLJournalPayload = {
    sourceEventId: batchId,
    sourceDocNo: caDocNo,
    ruleCode: 'CA-01',
    date: dateStr,
    reference: `TOPUP-${picName.toUpperCase()}`,
    description: `CA-01: Pencairan Dana Kas Kecil / Cash Advance (${picName} - ${purpose}) via ${disbursedBank}`,
    lines: [
      {
        accountKey: 'EMPLOYEE_ADVANCE', // 1-1401
        debit: topUpAmount,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Pencairan uang muka kerja operasional karyawan: ${picName}`
      },
      {
        accountKey: disbursedBank, // 1-1102 or 1-1103
        debit: 0,
        credit: topUpAmount,
        unitId: 'U009',
        locationId: 'L002',
        description: `Pengeluaran rekening bank untuk top up kas kecil ${picName}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const newBatch: CashAdvanceBatch = {
    id: batchId,
    caBatchId: caDocNo,
    picName,
    purpose,
    dateDisbursed: dateStr,
    disbursedBank,
    topUpAmount,
    realizedAmount: 0,
    returnedAmount: 0,
    remainingBalance: topUpAmount,
    status: 'ACTIVE',
    ca01JournalId: glRes.journal.id,
    realizationItems: [],
    ca02JournalIds: [],
    ca03JournalIds: [],
    notes
  };

  return { success: true, batch: newBatch, glJournal: glRes.journal };
}

/**
 * CA-02: Realisasi Pertanggungjawaban Nota Belanja CA (FLOW-11)
 * - Jika nota bahan baku/stok: Dr 5-1100 PERIODIC_PURCHASE (+ update Stock_Subledger)
 * - Jika nota operasional: Dr 6-xxxx Beban terkait (6-1104, 6-1203, 6-1303, 6-1305, 6-1307)
 * - Cr 1-1401 EMPLOYEE_ADVANCE
 */
export function executeRealizationCA02(params: {
  batch: CashAdvanceBatch;
  receipts: Array<{
    receiptNumber: string;
    vendorOrMerchant: string;
    description: string;
    itemCategory: CARealizationItem['itemCategory'];
    amount: number;
    unitId: BusinessUnitId;
    locationId: PhysicalLocationId;
    isStockItem: boolean;
    sku?: string;
    qty?: number;
    unitPrice?: number;
  }>;
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { 
  success: boolean; 
  updatedBatch?: CashAdvanceBatch; 
  glJournal?: GLJournalEntry; 
  error?: string 
} {
  const { batch, receipts, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  if (receipts.length === 0) {
    return { success: false, error: 'Daftar nota belanja tidak boleh kosong.' };
  }

  const totalReceiptsAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

  if (totalReceiptsAmount > batch.remainingBalance) {
    return {
      success: false,
      error: `Total nota realisasi (Rp ${totalReceiptsAmount.toLocaleString('id-ID')}) melebihi sisa saldo Cash Advance (Rp ${batch.remainingBalance.toLocaleString('id-ID')}).`
    };
  }

  const realizationId = `REAL-CA-${Date.now()}`;
  const docNo = `NOT-CA-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glLines: Array<{
    accountKey: string;
    debit: number;
    credit: number;
    unitId: BusinessUnitId;
    locationId?: PhysicalLocationId;
    description: string;
  }> = [];

  const createdRealizationItems: CARealizationItem[] = [];

  for (const r of receipts) {
    let targetAccountKey = 'EXP_SMALL_SUPPLIES'; // 6-1305 default
    let targetAccountCode = '6-1305';

    if (r.isStockItem) {
      targetAccountKey = 'PERIODIC_PURCHASE'; // 5-1100
      targetAccountCode = '5-1100';
    } else {
      switch (r.itemCategory) {
        case 'CREW_MEAL':
          targetAccountKey = 'CREW_MEAL'; // 6-1104
          targetAccountCode = '6-1104';
          break;
        case 'GAS_LPG':
          targetAccountKey = 'EXP_GAS'; // 6-1203
          targetAccountCode = '6-1203';
          break;
        case 'FREIGHT':
          targetAccountKey = 'EXP_FREIGHT'; // 6-1303
          targetAccountCode = '6-1303';
          break;
        case 'EVENT_OPEX':
          targetAccountKey = 'EXP_EVENT'; // 6-1307
          targetAccountCode = '6-1307';
          break;
        case 'SMALL_SUPPLIES':
        default:
          targetAccountKey = 'EXP_SMALL_SUPPLIES'; // 6-1305
          targetAccountCode = '6-1305';
          break;
      }
    }

    glLines.push({
      accountKey: targetAccountKey,
      debit: r.amount,
      credit: 0,
      unitId: r.unitId,
      locationId: r.locationId,
      description: `Realisasi CA: ${r.description} (${r.vendorOrMerchant})`
    });

    createdRealizationItems.push({
      id: `rcpt-${Date.now()}-${createdRealizationItems.length}`,
      date: dateStr,
      receiptNumber: r.receiptNumber,
      vendorOrMerchant: r.vendorOrMerchant,
      description: r.description,
      itemCategory: r.itemCategory,
      targetAccountKey,
      targetAccountCode,
      amount: r.amount,
      unitId: r.unitId,
      locationId: r.locationId,
      isStockItem: r.isStockItem,
      sku: r.sku,
      qty: r.qty,
      unitPrice: r.unitPrice
    });
  }

  // Credit 1-1401 EMPLOYEE_ADVANCE for total receipts
  glLines.push({
    accountKey: 'EMPLOYEE_ADVANCE', // 1-1401
    debit: 0,
    credit: totalReceiptsAmount,
    unitId: 'U009',
    locationId: 'L002',
    description: `Pertanggungjawaban nota belanja kas advance ${batch.picName}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: realizationId,
    sourceDocNo: docNo,
    ruleCode: 'CA-02',
    date: dateStr,
    reference: `${batch.caBatchId} / ${batch.picName}`,
    description: `CA-02: Realisasi Pertanggungjawaban Nota Belanja ${batch.picName} (${receipts.length} nota)`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const newRealizedTotal = batch.realizedAmount + totalReceiptsAmount;
  const newRemainingBalance = batch.topUpAmount - newRealizedTotal - batch.returnedAmount;

  const updatedBatch: CashAdvanceBatch = {
    ...batch,
    realizedAmount: newRealizedTotal,
    remainingBalance: newRemainingBalance,
    realizationItems: [...batch.realizationItems, ...createdRealizationItems],
    ca02JournalIds: [...batch.ca02JournalIds, glRes.journal.id]
  };

  return { success: true, updatedBatch, glJournal: glRes.journal };
}

/**
 * CA-03: Setoran Pengembalian Sisa Kas CA / Overpaid Kembali ke Bank (FLOW-11, UAT-035)
 * Jurnal: Dr 1-1103 Bank Mandiri atau 1-1102 Bank BNI / Cr 1-1401 EMPLOYEE_ADVANCE
 * KONTROL WAJIB (UAT-035):
 * DILARANG KERAS mencatat mutasi pengembalian CA ke akun Pendapatan (4-xxxx) atau tabel Penjualan!
 */
export function executeReturnCA03(params: {
  batch: CashAdvanceBatch;
  returnAmount: number;
  targetBank: 'BANK_MANDIRI' | 'BANK_BNI';
  dateStr: string;
  transferReference: string;
  targetCreditAccountKey?: string; // Must be EMPLOYEE_ADVANCE!
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; updatedBatch?: CashAdvanceBatch; glJournal?: GLJournalEntry; error?: string } {
  const { batch, returnAmount, targetBank, dateStr, transferReference, targetCreditAccountKey = 'EMPLOYEE_ADVANCE', makerUserId, existingJournals, nextJournalNumber } = params;

  if (returnAmount <= 0) {
    return { success: false, error: 'Nominal pengembalian harus lebih besar dari Rp 0.' };
  }

  if (returnAmount > batch.remainingBalance) {
    return {
      success: false,
      error: `Nominal pengembalian (Rp ${returnAmount.toLocaleString('id-ID')}) melebihi sisa saldo Cash Advance (Rp ${batch.remainingBalance.toLocaleString('id-ID')}).`
    };
  }

  // HARD CONSTRAINT: Rule UAT-035 Anti-Fake-Revenue
  if (
    targetCreditAccountKey.startsWith('REV_') || 
    targetCreditAccountKey === 'SALES_RETURNS' || 
    targetCreditAccountKey.startsWith('4-')
  ) {
    throw new Error(
      `[UAT-035 Anti-Fake-Revenue Violation] Mutasi pengembalian sisa Cash Advance dari '${batch.picName}' DILARANG KERAS dikreditkan ke akun Pendapatan (${targetCreditAccountKey})! Wajib mengkredit 1-1401 Cash Advance Karyawan.`
    );
  }

  const returnId = `RET-CA-${Date.now()}`;
  const docNo = `SET-CA-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  // Jurnal CA-03: Dr 1-1103/1-1102 / Cr 1-1401 EMPLOYEE_ADVANCE
  const glPayload: CoreGLJournalPayload = {
    sourceEventId: returnId,
    sourceDocNo: docNo,
    ruleCode: 'CA-03',
    date: dateStr,
    reference: `RETURN-${transferReference}`,
    description: `CA-03: Setoran Pengembalian Sisa Kas Advance ${batch.picName} [Strict Non-Revenue / UAT-035]`,
    lines: [
      {
        accountKey: targetBank, // 1-1102 or 1-1103
        debit: returnAmount,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Setoran transfer masuk pengembalian sisa kas dari ${batch.picName}`
      },
      {
        accountKey: 'EMPLOYEE_ADVANCE', // 1-1401
        debit: 0,
        credit: returnAmount,
        unitId: 'U009',
        locationId: 'L002',
        description: `Penutupan sisa kas advance karyawan: ${batch.picName}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const newReturnedTotal = batch.returnedAmount + returnAmount;
  const newRemainingBalance = batch.topUpAmount - batch.realizedAmount - newReturnedTotal;
  const isSettled = newRemainingBalance <= 0;

  const updatedBatch: CashAdvanceBatch = {
    ...batch,
    returnedAmount: newReturnedTotal,
    remainingBalance: newRemainingBalance,
    status: isSettled ? 'SETTLED' : 'ACTIVE',
    ca03JournalIds: [...batch.ca03JournalIds, glRes.journal.id]
  };

  return { success: true, updatedBatch, glJournal: glRes.journal };
}
