/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 2: Sales & Settlement Event Engine (SAL-01 s/d SAL-08)
 * 
 * Implementasi lengkap:
 * - SAL-01: POS Tunai
 * - SAL-02: POS Non-Tunai (QRIS BNI, QRIS Mandiri, EDC Mandiri, Ayo Platform)
 * - SAL-03: Invoice Kredit / Event Korporat
 * - SAL-04: Settlement Provider Cair ke Rekening Bank + Potongan MDR
 * - SAL-05: Refund / Retur Penjualan Tertaut ID Asli
 * - SAL-06: Uang Muka Turnamen Lintas Bulan (Kredit 2-1301)
 * - SAL-07: Closing Turnamen Selesai + Rekonsiliasi Refund ke Net Omzet (4-1102)
 * - SAL-08: Akrual Otomatis Bagi Hasil 15% Coffee Benteng ke The Lawu Group
 */

import { 
  SalesTransaction, 
  PaymentChannel, 
  PaymentProviderConfig, 
  SettlementBatch, 
  SalesRefundRecord, 
  TournamentEventRecord, 
  TournamentRegistrationParticipant, 
  BentengSharingAccrual,
  TaxObject
} from '../types/salesAndTax';
import { BusinessUnitId, PhysicalLocationId, CoreGLJournalPayload } from '../types/module1';
import { GLJournalEntry } from '../types/erp';
import { executeCoreGLPosting } from './coreGlEngine';
import { taxMatrixEngine } from './taxMatrixService';
import { resolveAccount } from './accountResolver';

export const PAYMENT_PROVIDERS: Record<PaymentChannel, PaymentProviderConfig> = {
  CASH: {
    channel: 'CASH',
    name: 'Uang Tunai Kasir (Cash on Hand)',
    clearingAccountKey: 'CASH_ON_HAND',
    clearingAccountCode: '1-1101',
    targetBankAccountKey: 'CASH_ON_HAND',
    targetBankAccountCode: '1-1101',
    mdrFeePercent: 0
  },
  QRIS_BNI: {
    channel: 'QRIS_BNI',
    name: 'QRIS BNI Dynamic',
    clearingAccountKey: 'PAYMENT_CLEARING',
    clearingAccountCode: '1-1201',
    targetBankAccountKey: 'BANK_BNI',
    targetBankAccountCode: '1-1102',
    mdrFeePercent: 0.7 // 0.7% MDR QRIS
  },
  QRIS_MANDIRI: {
    channel: 'QRIS_MANDIRI',
    name: 'QRIS Mandiri Livin Merchant',
    clearingAccountKey: 'PAYMENT_CLEARING',
    clearingAccountCode: '1-1201',
    targetBankAccountKey: 'BANK_MANDIRI',
    targetBankAccountCode: '1-1103',
    mdrFeePercent: 0.7
  },
  EDC_MANDIRI: {
    channel: 'EDC_MANDIRI',
    name: 'EDC Mandiri Debit / Kartu Kredit',
    clearingAccountKey: 'PAYMENT_CLEARING',
    clearingAccountCode: '1-1201',
    targetBankAccountKey: 'BANK_MANDIRI',
    targetBankAccountCode: '1-1103',
    mdrFeePercent: 1.5 // 1.5% MDR Kartu
  },
  AYO_INDONESIA: {
    channel: 'AYO_INDONESIA',
    name: 'Ayo Platform App Booking',
    clearingAccountKey: 'PAYMENT_CLEARING',
    clearingAccountCode: '1-1201',
    targetBankAccountKey: 'BANK_MANDIRI',
    targetBankAccountCode: '1-1103',
    mdrFeePercent: 3.5 // 3.5% Ayo commission
  },
  CORPORATE_INVOICE: {
    channel: 'CORPORATE_INVOICE',
    name: 'Invoice Kredit B2B / Korporat',
    clearingAccountKey: 'AR_CUSTOMER',
    clearingAccountCode: '1-1202',
    targetBankAccountKey: 'BANK_MANDIRI',
    targetBankAccountCode: '1-1103',
    mdrFeePercent: 0
  }
};

/**
 * SAL-01, SAL-02, SAL-03: Process Sales Transaction
 */
export function executeSalesEvent(params: {
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  channel: PaymentChannel;
  customerName: string;
  items: Array<{
    sku: string;
    name: string;
    revenueAccountKey: 'REV_PADEL' | 'REV_FNB' | 'REV_MERCH';
    grossPrice: number;
    qty: number;
  }>;
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; sale?: SalesTransaction; glJournal?: GLJournalEntry; error?: string } {
  const { unitId, locationId, channel, customerName, items, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  // Determine Rule Code: SAL-01 (Cash), SAL-02 (Non-Cash Provider), SAL-03 (Credit Invoice)
  let ruleCode: 'SAL-01' | 'SAL-02' | 'SAL-03' = 'SAL-01';
  if (channel === 'CASH') {
    ruleCode = 'SAL-01';
  } else if (channel === 'CORPORATE_INVOICE') {
    ruleCode = 'SAL-03';
  } else {
    ruleCode = 'SAL-02';
  }

  // Calculate gross, DPP, and Tax per line using TaxMatrixEngine
  let totalGross = 0;
  let totalDpp = 0;
  let totalTax = 0;

  const taxObject: TaxObject = unitId === 'U001' ? 'PBJT_PADEL' : 'PBJT_FNB_RESTO';

  const processedItems = items.map(item => {
    const lineGross = item.grossPrice * item.qty;
    totalGross += lineGross;

    const taxCalc = taxMatrixEngine.calculateTax(unitId, locationId, taxObject, lineGross, dateStr);
    totalDpp += taxCalc.dppNetAmount;
    totalTax += taxCalc.taxAmount;

    return {
      sku: item.sku,
      name: item.name,
      revenueAccountKey: item.revenueAccountKey,
      grossPrice: item.grossPrice,
      qty: item.qty,
      totalGross: lineGross
    };
  });

  // Resolve Debit Account based on channel
  const provider = PAYMENT_PROVIDERS[channel];
  const debitAccountKey = provider.clearingAccountKey;

  // Resolve PBJT Tax liability account
  const taxAccountKey = 'PBJT_PAYABLE';

  // Build Double-Entry GL Lines:
  // Dr Cash/Bank/Clearing (Total Gross)
  // Cr Net Revenue per line or grouped
  // Cr PBJT Tax Liability
  const glLines = [
    {
      accountKey: debitAccountKey,
      debit: totalGross,
      credit: 0,
      unitId,
      locationId,
      description: `${ruleCode}: Penerimaan ${provider.name} - ${customerName}`
    },
    {
      accountKey: items[0]?.revenueAccountKey || 'REV_FNB',
      debit: 0,
      credit: totalDpp,
      unitId,
      locationId,
      description: `${ruleCode}: Pendapatan Penjualan Neto (DPP) - ${customerName}`
    }
  ];

  if (totalTax > 0) {
    glLines.push({
      accountKey: taxAccountKey,
      debit: 0,
      credit: totalTax,
      unitId,
      locationId,
      description: `${ruleCode}: Utang PBJT Pajak Daerah 10% - ${customerName}`
    });
  }

  const saleId = `SALE-${Date.now()}`;
  const saleNumber = `POS-${unitId}-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: saleId,
    sourceDocNo: saleNumber,
    ruleCode,
    date: dateStr,
    reference: saleNumber,
    description: `${ruleCode} [${channel}]: Penjualan ${customerName} (${totalGross.toLocaleString('id-ID')})`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const saleRecord: SalesTransaction = {
    id: saleId,
    saleNumber,
    ruleCode,
    date: dateStr,
    unitId,
    locationId,
    customerName,
    channel,
    items: processedItems,
    grossTotal: totalGross,
    dppTotal: totalDpp,
    taxTotal: totalTax,
    glJournalId: glRes.journal.id,
    settlementStatus: channel === 'CASH' || channel === 'CORPORATE_INVOICE' ? 'NOT_APPLICABLE' : 'PENDING_CLEARING',
    createdAt: new Date().toISOString(),
    cashierOrActor: makerUserId
  };

  return {
    success: true,
    sale: saleRecord,
    glJournal: glRes.journal
  };
}

/**
 * SAL-04: Settlement Provider Cair ke Rekening Bank
 * Dr Bank BNI/Mandiri (net disbursement)
 * Dr 6-1301 Beban MDR / Admin (PAYMENT_FEES)
 * Cr 1-1201 Piutang Settlement Provider (PAYMENT_CLEARING)
 */
export function executeSettlementDisbursementSAL04(params: {
  providerChannel: PaymentChannel;
  grossAmount: number;
  dateStr: string;
  salesIds: string[];
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; settlementBatch?: SettlementBatch; glJournal?: GLJournalEntry; error?: string } {
  const { providerChannel, grossAmount, dateStr, salesIds, makerUserId, existingJournals, nextJournalNumber } = params;

  const provider = PAYMENT_PROVIDERS[providerChannel];
  const mdrRate = provider.mdrFeePercent / 100;
  const mdrFee = Math.round(grossAmount * mdrRate);
  const netDisbursed = grossAmount - mdrFee;

  const batchId = `SETTLE-${Date.now()}`;
  const batchNumber = `SETTLE-${providerChannel}-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: batchId,
    sourceDocNo: batchNumber,
    ruleCode: 'SAL-04',
    date: dateStr,
    reference: batchNumber,
    description: `SAL-04: Pencairan Settlement ${provider.name} (Bruto: ${grossAmount.toLocaleString('id-ID')}, MDR: ${mdrFee.toLocaleString('id-ID')})`,
    lines: [
      {
        accountKey: provider.targetBankAccountKey, // 1-1102 (BNI) or 1-1103 (Mandiri)
        debit: netDisbursed,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Dana cair bersih ke rekening ${provider.targetBankAccountKey}`
      },
      {
        accountKey: 'PAYMENT_FEES', // 6-1301
        debit: mdrFee,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: `Beban MDR / Komisi Provider (${provider.mdrFeePercent}%)`
      },
      {
        accountKey: 'PAYMENT_CLEARING', // 1-1201
        debit: 0,
        credit: grossAmount,
        unitId: 'U009',
        locationId: 'L002',
        description: `Pelunasan piutang kliring provider ${provider.name}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const batchRecord: SettlementBatch = {
    id: batchId,
    batchNumber,
    ruleCode: 'SAL-04',
    date: dateStr,
    provider: providerChannel,
    grossAmount,
    mdrFeeAmount: mdrFee,
    netDisbursedAmount: netDisbursed,
    bankAccountKey: provider.targetBankAccountKey as any,
    bankAccountCode: provider.targetBankAccountCode,
    salesTransactionIds: salesIds,
    glJournalId: glRes.journal.id,
    disbursedAt: new Date().toISOString(),
    processedBy: makerUserId
  };

  return {
    success: true,
    settlementBatch: batchRecord,
    glJournal: glRes.journal
  };
}

/**
 * SAL-05: Refund / Retur Penjualan (Tertaut ID Asli)
 * Dr 4-1901 Refund Penjualan + Dr 2-1201/2-1202 PBJT / Cr Bank Mandiri / Clearing / Refund Payable
 */
export function executeSalesRefundSAL05(params: {
  originalSale: SalesTransaction;
  refundReason: string;
  refundAmountGross: number; // e.g. full or partial gross refund
  refundMethod: 'MANDIRI_TRANSFER' | 'CLEARING_REVERSAL' | 'REFUND_PAYABLE';
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; refundRecord?: SalesRefundRecord; glJournal?: GLJournalEntry; error?: string } {
  const { originalSale, refundReason, refundAmountGross, refundMethod, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  // Calculate tax portion of the refund
  const taxObject: TaxObject = originalSale.unitId === 'U001' ? 'PBJT_PADEL' : 'PBJT_FNB_RESTO';
  const taxCalc = taxMatrixEngine.calculateTax(originalSale.unitId, originalSale.locationId, taxObject, refundAmountGross, dateStr);

  const refundDpp = taxCalc.dppNetAmount;
  const refundTax = taxCalc.taxAmount;

  // Target credit account
  let creditKey = 'BANK_MANDIRI'; // 1-1103
  if (refundMethod === 'CLEARING_REVERSAL') creditKey = 'PAYMENT_CLEARING';
  if (refundMethod === 'REFUND_PAYABLE') creditKey = 'REFUND_PAYABLE';

  const refundId = `REF-${Date.now()}`;
  const refundNumber = `RET-${originalSale.saleNumber}-${Math.floor(100 + Math.random() * 900)}`;

  const glLines = [
    {
      accountKey: 'SALES_RETURNS', // 4-1901
      debit: refundDpp,
      credit: 0,
      unitId: originalSale.unitId,
      locationId: originalSale.locationId,
      description: `SAL-05: Retur/Refund Penjualan Ref ${originalSale.saleNumber}: ${refundReason}`
    }
  ];

  if (refundTax > 0) {
    glLines.push({
      accountKey: 'PBJT_PAYABLE', // 2-1201 or 2-1202
      debit: refundTax,
      credit: 0,
      unitId: originalSale.unitId,
      locationId: originalSale.locationId,
      description: `SAL-05: Koreksi/Reversal Pajak PBJT Ref ${originalSale.saleNumber}`
    });
  }

  glLines.push({
    accountKey: creditKey,
    debit: 0,
    credit: refundAmountGross,
    unitId: originalSale.unitId,
    locationId: originalSale.locationId,
    description: `SAL-05: Pengembalian dana refund via ${refundMethod}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: refundId,
    sourceDocNo: refundNumber,
    ruleCode: 'SAL-05',
    date: dateStr,
    reference: `REFUND-FOR-${originalSale.saleNumber}`,
    description: `SAL-05: Refund Penjualan Transaksi ${originalSale.saleNumber} (${refundReason}) [UAT-008]`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const record: SalesRefundRecord = {
    id: refundId,
    refundNumber,
    ruleCode: 'SAL-05',
    originalSaleId: originalSale.id,
    originalSaleNumber: originalSale.saleNumber,
    date: dateStr,
    unitId: originalSale.unitId,
    locationId: originalSale.locationId,
    refundReason,
    refundGrossAmount: refundAmountGross,
    refundDppAmount: refundDpp,
    refundTaxAmount: refundTax,
    refundPaymentMethod: refundMethod,
    refundDisbursedAccountCode: creditKey,
    glJournalId: glRes.journal.id,
    processedBy: makerUserId
  };

  return {
    success: true,
    refundRecord: record,
    glJournal: glRes.journal
  };
}

/**
 * SAL-06: Pendaftaran Turnamen Lintas Bulan (Uang Muka 2-1301)
 * Dr 1-1103 Bank Mandiri / Cr 2-1301 Pendapatan Diterima di Muka Turnamen (UNEARNED_REV_EVENT)
 */
export function executeTournamentRegistrationSAL06(params: {
  tournament: TournamentEventRecord;
  teamName: string;
  player1Name: string;
  player2Name: string;
  categoryTariff: 'ROOKIE_MIX' | 'BEGINNER' | 'LOWER_BRONZE' | 'OPEN_MASTERS';
  feeAmount: number; // e.g. 500000, 550000, 650000
  paymentDate: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; participant?: TournamentRegistrationParticipant; glJournal?: GLJournalEntry; error?: string } {
  const { tournament, teamName, player1Name, player2Name, categoryTariff, feeAmount, paymentDate, makerUserId, existingJournals, nextJournalNumber } = params;

  const participantId = `PART-${Date.now()}`;
  const docNo = `REG-${tournament.code}-${teamName.replace(/\s+/g, '').toUpperCase()}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: participantId,
    sourceDocNo: docNo,
    ruleCode: 'SAL-06',
    date: paymentDate,
    reference: `${tournament.name} / ${teamName}`,
    description: `SAL-06: Uang Muka Registrasi Turnamen (${teamName} - ${categoryTariff}) [Anti-Omzet Palsu]`,
    lines: [
      {
        accountKey: 'BANK_MANDIRI', // 1-1103
        debit: feeAmount,
        credit: 0,
        unitId: 'U001',
        locationId: 'L001',
        description: `Penerimaan fee pendaftaran turnamen ${teamName}`
      },
      {
        accountKey: 'UNEARNED_REV_EVENT', // 2-1301
        debit: 0,
        credit: feeAmount,
        unitId: 'U001',
        locationId: 'L001',
        description: `Liabilitas uang muka turnamen padel (Bukan Pendapatan)`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const participant: TournamentRegistrationParticipant = {
    id: participantId,
    tournamentId: tournament.id,
    teamName,
    player1Name,
    player2Name,
    categoryTariff,
    feeAmount,
    paymentDate,
    bankReference: `MANDIRI-TRF-${Date.now()}`,
    status: 'PAID_ACTIVE',
    sal06JournalId: glRes.journal.id
  };

  return {
    success: true,
    participant,
    glJournal: glRes.journal
  };
}

/**
 * SAL-07: Closing Turnamen Selesai & Rekonsiliasi Refund ke Omzet Resmi
 * Dr 2-1301 (Total deposit) / Cr 1-1103 (Refund) + Cr 4-1102 (Net Omzet)
 * Saldo 2-1301 untuk turnamen ini wajib menjadi Rp 0!
 */
export function executeTournamentSettlementSAL07(params: {
  tournament: TournamentEventRecord;
  totalRefunds: number; // e.g. Rp 3.150.000 for withdrawals
  settlementDate: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; glJournal?: GLJournalEntry; netRevenue?: number; error?: string } {
  const { tournament, totalRefunds, settlementDate, makerUserId, existingJournals, nextJournalNumber } = params;

  const totalCollected = tournament.totalDepositsCollected;
  if (totalCollected <= 0) {
    return { success: false, error: 'Tidak ada deposit terdaftar untuk turnamen ini.' };
  }

  if (totalRefunds > totalCollected) {
    return { success: false, error: 'Nilai refund tidak boleh melebihi total uang muka yang terkumpul.' };
  }

  const netRevenue = totalCollected - totalRefunds;
  const settlementDocNo = `SETTLE-${tournament.code}-FINAL`;

  const glLines = [
    {
      accountKey: 'UNEARNED_REV_EVENT', // 2-1301
      debit: totalCollected,
      credit: 0,
      unitId: 'U001' as const,
      locationId: 'L001' as const,
      description: `SAL-07: Penutupan penuh liabilitas uang muka ${tournament.name} (Saldo jadi 0)`
    }
  ];

  if (totalRefunds > 0) {
    glLines.push({
      accountKey: 'BANK_MANDIRI', // 1-1103
      debit: 0,
      credit: totalRefunds,
      unitId: 'U001' as const,
      locationId: 'L001' as const,
      description: `SAL-07: Pengembalian transfer refund peserta turnamen mundur/cedera`
    });
  }

  glLines.push({
    accountKey: 'REV_PADEL_EVENT', // 4-1102
    debit: 0,
    credit: netRevenue,
    unitId: 'U001' as const,
    locationId: 'L001' as const,
    description: `SAL-07: Pengakuan omzet resmi bersih event turnamen ${tournament.name}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: `SETTLE-EVT-${tournament.id}`,
    sourceDocNo: settlementDocNo,
    ruleCode: 'SAL-07',
    date: settlementDate,
    reference: settlementDocNo,
    description: `SAL-07: Reklasifikasi Turnamen ${tournament.name} (Deposit ${totalCollected.toLocaleString('id-ID')}, Refund ${totalRefunds.toLocaleString('id-ID')}, Net ${netRevenue.toLocaleString('id-ID')})`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  return {
    success: true,
    glJournal: glRes.journal,
    netRevenue
  };
}

/**
 * SAL-08: Akrual Otomatis Bagi Hasil 15% Coffee Benteng ke The Lawu Group
 * Dr 6-1403 Beban Sewa & Bagi Hasil 15% Benteng (EXP_SHARING_BENTENG)
 * Cr 2-1105 Hutang Bagi Hasil 15% Coffee Benteng — The Lawu Group (SHARING_PAYABLE_BENTENG)
 */
export function executeBentengSharingAccrualSAL08(params: {
  grossTurnoverU003: number;
  periodLabel: string;
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; accrualRecord?: BentengSharingAccrual; glJournal?: GLJournalEntry; error?: string } {
  const { grossTurnoverU003, periodLabel, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  if (grossTurnoverU003 <= 0) {
    return { success: false, error: 'Omzet bruto U003 harus lebih besar dari Rp 0 untuk menghitung bagi hasil.' };
  }

  const sharingRate = 0.15; // 15%
  const accrualAmount = Math.round(grossTurnoverU003 * sharingRate);

  const accrualId = `ACCR-BTG-${Date.now()}`;
  const docNo = `SHR-BTG-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: accrualId,
    sourceDocNo: docNo,
    ruleCode: 'SAL-08',
    date: dateStr,
    reference: `SHARING-15%-THE-LAWU-GROUP`,
    description: `SAL-08: Akrual Otomatis Bagi Hasil 15% Coffee Benteng (${periodLabel}): 15% x Rp ${grossTurnoverU003.toLocaleString('id-ID')}`,
    lines: [
      {
        accountKey: 'EXP_SHARING_BENTENG', // 6-1403
        debit: accrualAmount,
        credit: 0,
        unitId: 'U003',
        locationId: 'L005',
        description: `Beban bagi hasil 15% pengelolaan Coffee Benteng Ambarawa`
      },
      {
        accountKey: 'SHARING_PAYABLE_BENTENG', // 2-1105
        debit: 0,
        credit: accrualAmount,
        unitId: 'U003',
        locationId: 'L005',
        description: `Hutang bagi hasil 15% kepada The Lawu Group`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const accrualRecord: BentengSharingAccrual = {
    id: accrualId,
    batchNumber: docNo,
    ruleCode: 'SAL-08',
    date: dateStr,
    unitId: 'U003',
    locationId: 'L005',
    periodLabel,
    grossSalesTurnover: grossTurnoverU003,
    sharingPercentage: sharingRate,
    accrualAmount,
    glJournalId: glRes.journal.id,
    processedBy: makerUserId
  };

  return {
    success: true,
    accrualRecord,
    glJournal: glRes.journal
  };
}
