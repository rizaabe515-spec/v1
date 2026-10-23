/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 4 Initial Seed Data: Cash Advance Subledger & Bank Statement Mutations
 */

import { CashAdvanceBatch, BankStatementLine } from '../types/cashAdvanceAndBanking';

export const INITIAL_CA_BATCHES: CashAdvanceBatch[] = [
  {
    id: 'CA-BATCH-001',
    caBatchId: 'CA-2026-09-ABE',
    picName: 'Abe Riza Kurniawan',
    purpose: 'OPERATIONAL_MONTHLY',
    dateDisbursed: '2026-09-01',
    disbursedBank: 'BANK_MANDIRI',
    topUpAmount: 15000000,
    realizedAmount: 8500000,
    returnedAmount: 0,
    remainingBalance: 6500000,
    status: 'ACTIVE',
    ca01JournalId: 'JV-2026-09-0040',
    realizationItems: [
      {
        id: 'rcpt-01',
        date: '2026-09-03',
        receiptNumber: 'NOTA-ROASTERY-01',
        vendorOrMerchant: 'Salatiga Roastery Lokal',
        description: 'Beli biji kopi arabika darurat 25kg untuk Bar JB',
        itemCategory: 'RAW_MATERIAL_STOCK',
        targetAccountKey: 'PERIODIC_PURCHASE',
        targetAccountCode: '5-1100',
        amount: 3500000,
        unitId: 'U002',
        locationId: 'L003',
        isStockItem: true,
        sku: 'INV-COFFEE-01',
        qty: 25,
        unitPrice: 140000
      },
      {
        id: 'rcpt-02',
        date: '2026-09-04',
        receiptNumber: 'NOTA-WARUNG-02',
        vendorOrMerchant: 'Warung Barokah Salatiga',
        description: 'Makan siang kru shift operasional & barista',
        itemCategory: 'CREW_MEAL',
        targetAccountKey: 'CREW_MEAL',
        targetAccountCode: '6-1104',
        amount: 1200000,
        unitId: 'U002',
        locationId: 'L004',
        isStockItem: false
      },
      {
        id: 'rcpt-03',
        date: '2026-09-06',
        receiptNumber: 'NOTA-AGEN-LPG-03',
        vendorOrMerchant: 'Agen Gas Pertamina Salatiga',
        description: 'Refill gas elpiji 50kg komersial untuk Kitchen',
        itemCategory: 'GAS_LPG',
        targetAccountKey: 'EXP_GAS',
        targetAccountCode: '6-1203',
        amount: 1800000,
        unitId: 'U002',
        locationId: 'L004',
        isStockItem: false
      },
      {
        id: 'rcpt-04',
        date: '2026-09-08',
        receiptNumber: 'RESI-CARGO-04',
        vendorOrMerchant: 'Kalog Express',
        description: 'Ongkos angkut kargo ekspedisi bola padel dari Jakarta',
        itemCategory: 'FREIGHT',
        targetAccountKey: 'EXP_FREIGHT',
        targetAccountCode: '6-1303',
        amount: 2000000,
        unitId: 'U001',
        locationId: 'L001',
        isStockItem: false
      }
    ],
    ca02JournalIds: ['JV-2026-09-0041'],
    ca03JournalIds: [],
    notes: 'Dana kas kecil operasional outlet Salatiga & venue padel'
  }
];

export const INITIAL_BANK_STATEMENTS: BankStatementLine[] = [
  // Rekening Bank Mandiri Operasional: 1360036961297
  {
    id: 'stmt-mandiri-001',
    bankAccount: 'BANK_MANDIRI',
    accountNumber: '1360036961297',
    date: '2026-09-02',
    description: 'TRF CR PT DKSI PINJAMAN MODAL KERJA AFILIASI',
    mutationType: 'CR',
    amount: 50000000,
    balanceAfter: 125000000,
    referenceNo: 'MANDIRI-CR-9921',
    category: 'PENERIMAAN_NON_OMZET',
    nonRevenueSubtype: 'LOAN_PT_DKSI',
    reconciliationStatus: 'POSTED_GL',
    glJournalId: 'JV-2026-09-0042',
    isEliminatedFromRevenue: true
  },
  {
    id: 'stmt-mandiri-002',
    bankAccount: 'BANK_MANDIRI',
    accountNumber: '1360036961297',
    date: '2026-09-04',
    description: 'SETORAN TUNAI TALANGAN MODAL PEMILIK BAPAK HENDRA',
    mutationType: 'CR',
    amount: 25000000,
    balanceAfter: 150000000,
    referenceNo: 'MANDIRI-CR-9922',
    category: 'PENERIMAAN_NON_OMZET',
    nonRevenueSubtype: 'OWNER_ADVANCE',
    reconciliationStatus: 'POSTED_GL',
    glJournalId: 'JV-2026-09-0043',
    isEliminatedFromRevenue: true
  },
  {
    id: 'stmt-mandiri-003',
    bankAccount: 'BANK_MANDIRI',
    accountNumber: '1360036961297',
    date: '2026-09-05',
    description: 'TRF CR ABE RIZA KURNIAWAN PENGEMBALIAN SISA CA OPS',
    mutationType: 'CR',
    amount: 4500000,
    balanceAfter: 154500000,
    referenceNo: 'MANDIRI-CR-9923',
    category: 'PENERIMAAN_NON_OMZET',
    nonRevenueSubtype: 'CA_RETURN',
    reconciliationStatus: 'UNRECONCILED',
    isEliminatedFromRevenue: true
  },
  {
    id: 'stmt-mandiri-004',
    bankAccount: 'BANK_MANDIRI',
    accountNumber: '1360036961297',
    date: '2026-09-06',
    description: 'TRF CR REGISTRASI TURNEY TIM SALATIGA SMASHERS',
    mutationType: 'CR',
    amount: 500000,
    balanceAfter: 155000000,
    referenceNo: 'MANDIRI-CR-9924',
    category: 'PENDAPATAN_TURNEY',
    reconciliationStatus: 'POSTED_GL',
    glJournalId: 'JV-2026-09-0020',
    isEliminatedFromRevenue: false
  },
  {
    id: 'stmt-mandiri-005',
    bankAccount: 'BANK_MANDIRI',
    accountNumber: '1360036961297',
    date: '2026-09-07',
    description: 'TRF CR REGISTRASI TURNEY LOWER BRONZE BOROBUDUR',
    mutationType: 'CR',
    amount: 650000,
    balanceAfter: 155650000,
    referenceNo: 'MANDIRI-CR-9925',
    category: 'PENDAPATAN_TURNEY',
    reconciliationStatus: 'POSTED_GL',
    glJournalId: 'JV-2026-09-0022',
    isEliminatedFromRevenue: false
  },

  // Rekening Bank BNI Collection: 2017204912
  {
    id: 'stmt-bni-001',
    bankAccount: 'BANK_BNI',
    accountNumber: '2017204912',
    date: '2026-09-02',
    description: 'SETTLEMENT QRIS BNI DYNAMIC NETT DISBURSEMENT',
    mutationType: 'CR',
    amount: 1489500,
    balanceAfter: 35000000,
    referenceNo: 'BNI-CR-1101',
    category: 'PENDAPATAN_OPERASIONAL_NON_TURNEY',
    reconciliationStatus: 'POSTED_GL',
    glJournalId: 'JV-2026-09-0015',
    isEliminatedFromRevenue: false
  },
  {
    id: 'stmt-bni-002',
    bankAccount: 'BANK_BNI',
    accountNumber: '2017204912',
    date: '2026-09-05',
    description: 'PINDAH BUKU INTERBANK DARI REKENING MANDIRI PADEL',
    mutationType: 'CR',
    amount: 10000000,
    balanceAfter: 45000000,
    referenceNo: 'BNI-CR-1102',
    category: 'PENERIMAAN_NON_OMZET',
    nonRevenueSubtype: 'INTERBANK_TRANSFER',
    reconciliationStatus: 'UNRECONCILED',
    isEliminatedFromRevenue: true
  },
  {
    id: 'stmt-bni-003',
    bankAccount: 'BANK_BNI',
    accountNumber: '2017204912',
    date: '2026-09-10',
    description: 'BUNGA JASA GIRO BNI BULAN SEPTEMBER 2026',
    mutationType: 'CR',
    amount: 280000,
    balanceAfter: 45280000,
    referenceNo: 'BNI-CR-1103',
    category: 'PENERIMAAN_NON_OMZET',
    nonRevenueSubtype: 'BANK_INTEREST',
    reconciliationStatus: 'UNRECONCILED',
    isEliminatedFromRevenue: true
  }
];
