/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 2 Initial Seed Data: Sales, Settlements, Tournaments, and Benteng Accruals
 */

import { 
  SalesTransaction, 
  SettlementBatch, 
  SalesRefundRecord, 
  TournamentEventRecord, 
  BentengSharingAccrual 
} from '../types/salesAndTax';

export const INITIAL_MODUL2_SALES: SalesTransaction[] = [
  {
    id: 'SALE-20260901-01',
    saleNumber: 'POS-U001-20260901-101',
    ruleCode: 'SAL-01',
    date: '2026-09-01',
    unitId: 'U001',
    locationId: 'L001',
    customerName: 'Budi Santoso (Court Rental Slot 1)',
    channel: 'CASH',
    items: [
      {
        sku: 'COURT-PRIME',
        name: 'Sewa Lapangan Padel Court 1 (2 Jam Prime)',
        revenueAccountKey: 'REV_PADEL',
        grossPrice: 350000,
        qty: 1,
        totalGross: 350000
      }
    ],
    grossTotal: 350000,
    dppTotal: 318182,
    taxTotal: 31818, // 10% PBJT inclusive
    glJournalId: 'JV-2026-09-0010',
    settlementStatus: 'NOT_APPLICABLE',
    createdAt: '2026-09-01T14:30:00Z',
    cashierOrActor: 'Kasir Court L001'
  },
  {
    id: 'SALE-20260902-02',
    saleNumber: 'POS-U002-20260902-102',
    ruleCode: 'SAL-02',
    date: '2026-09-02',
    unitId: 'U002',
    locationId: 'L003',
    customerName: 'Meja 04 - Ardi & Partners',
    channel: 'QRIS_BNI',
    items: [
      {
        sku: 'FNB-ESPRESSO',
        name: 'Signature Beans Espresso & Latte',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 65000,
        qty: 2,
        totalGross: 130000
      },
      {
        sku: 'FNB-CROISSANT',
        name: 'Butter Almond Croissant',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 45000,
        qty: 2,
        totalGross: 90000
      }
    ],
    grossTotal: 220000,
    dppTotal: 200000,
    taxTotal: 20000, // 10% PBJT resto inclusive
    glJournalId: 'JV-2026-09-0011',
    settlementStatus: 'PENDING_CLEARING',
    createdAt: '2026-09-02T16:15:00Z',
    cashierOrActor: 'Kasir Bar JB L003'
  },
  {
    id: 'SALE-20260903-03',
    saleNumber: 'POS-U002-20260903-103',
    ruleCode: 'SAL-02',
    date: '2026-09-03',
    unitId: 'U002',
    locationId: 'L004',
    customerName: 'Meja 12 - Komunitas Padel Semarang',
    channel: 'EDC_MANDIRI',
    items: [
      {
        sku: 'FNB-PASTA-TRUFFLE',
        name: 'Creamy Truffle Mushroom Pasta',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 95000,
        qty: 4,
        totalGross: 380000
      },
      {
        sku: 'FNB-STEAK-WAGYU',
        name: 'Wagyu Striploin MB5 200g',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 220000,
        qty: 2,
        totalGross: 440000
      }
    ],
    grossTotal: 820000,
    dppTotal: 745455,
    taxTotal: 74545,
    glJournalId: 'JV-2026-09-0012',
    settlementStatus: 'PENDING_CLEARING',
    createdAt: '2026-09-03T19:40:00Z',
    cashierOrActor: 'Kasir Kitchen Salatiga'
  },
  {
    id: 'SALE-20260904-04',
    saleNumber: 'POS-U003-20260904-104',
    ruleCode: 'SAL-02',
    date: '2026-09-04',
    unitId: 'U003',
    locationId: 'L005',
    customerName: 'Turis Heritage Ambarawa',
    channel: 'QRIS_MANDIRI',
    items: [
      {
        sku: 'FNB-KOPI-BENTENG',
        name: 'Kopi Susu Benteng Pendem',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 35000,
        qty: 4,
        totalGross: 140000
      },
      {
        sku: 'FNB-PISANG-GORENG',
        name: 'Pisang Goreng Keju Aren',
        revenueAccountKey: 'REV_FNB',
        grossPrice: 25000,
        qty: 2,
        totalGross: 50000
      }
    ],
    grossTotal: 190000,
    dppTotal: 172727,
    taxTotal: 17273,
    glJournalId: 'JV-2026-09-0013',
    settlementStatus: 'PENDING_CLEARING',
    createdAt: '2026-09-04T11:20:00Z',
    cashierOrActor: 'Kasir Benteng L005'
  },
  {
    id: 'SALE-20260905-05',
    saleNumber: 'INV-U001-20260905-001',
    ruleCode: 'SAL-03',
    date: '2026-09-05',
    unitId: 'U001',
    locationId: 'L001',
    customerName: 'PT Djarum Kudus (Corporate Gathering Booking)',
    channel: 'CORPORATE_INVOICE',
    items: [
      {
        sku: 'COURT-ALL-DAY',
        name: 'Sewa All Courts 4 Lapangan (Full Day Event)',
        revenueAccountKey: 'REV_PADEL',
        grossPrice: 6500000,
        qty: 1,
        totalGross: 6500000
      }
    ],
    grossTotal: 6500000,
    dppTotal: 5909091,
    taxTotal: 590909,
    glJournalId: 'JV-2026-09-0014',
    settlementStatus: 'NOT_APPLICABLE',
    createdAt: '2026-09-05T09:00:00Z',
    cashierOrActor: 'Event Marketing Lead'
  }
];

export const INITIAL_MODUL2_SETTLEMENTS: SettlementBatch[] = [
  {
    id: 'SETTLE-20260901-BNI',
    batchNumber: 'SETTLE-QRIS_BNI-20260901-01',
    ruleCode: 'SAL-04',
    date: '2026-09-02',
    provider: 'QRIS_BNI',
    grossAmount: 1500000,
    mdrFeeAmount: 10500, // 0.7% MDR
    netDisbursedAmount: 1489500,
    bankAccountKey: 'BANK_BNI',
    bankAccountCode: '1-1102',
    salesTransactionIds: ['SALE-HIST-01', 'SALE-HIST-02'],
    glJournalId: 'JV-2026-09-0015',
    disbursedAt: '2026-09-02T10:00:00Z',
    processedBy: 'Finance Controller'
  }
];

export const INITIAL_MODUL2_REFUNDS: SalesRefundRecord[] = [
  {
    id: 'REF-20260902-01',
    refundNumber: 'RET-POS-U001-20260901-101-01',
    ruleCode: 'SAL-05',
    originalSaleId: 'SALE-20260901-01',
    originalSaleNumber: 'POS-U001-20260901-101',
    date: '2026-09-02',
    unitId: 'U001',
    locationId: 'L001',
    refundReason: 'Hujan deras mendadak di outdoor court pada jam ke-2',
    refundGrossAmount: 175000,
    refundDppAmount: 159091,
    refundTaxAmount: 15909,
    refundPaymentMethod: 'MANDIRI_TRANSFER',
    refundDisbursedAccountCode: '1-1103',
    glJournalId: 'JV-2026-09-0016',
    processedBy: 'Finance Controller'
  }
];

export const INITIAL_MODUL2_TOURNAMENTS: TournamentEventRecord[] = [
  {
    id: 'TOURN-PB-OCT2026',
    code: 'PB-OCT-OPEN',
    name: 'Padel Beans Open Championship Season 1',
    registrationOpenDate: '2026-09-01',
    executionStartDate: '2026-10-15',
    executionEndDate: '2026-10-18',
    status: 'REGISTRATION_OPEN',
    totalDepositsCollected: 16900000, // Prepayments currently in 2-1301
    totalRefundsApproved: 0,
    netRevenueRecognized: 0,
    participants: [
      {
        id: 'PART-001',
        tournamentId: 'TOURN-PB-OCT2026',
        teamName: 'Salatiga Smashers',
        player1Name: 'Hendra Gunawan',
        player2Name: 'Bambang Supriyanto',
        categoryTariff: 'ROOKIE_MIX',
        feeAmount: 500000,
        paymentDate: '2026-09-05',
        bankReference: 'MANDIRI-TRF-98214',
        status: 'PAID_ACTIVE',
        sal06JournalId: 'JV-2026-09-0020'
      },
      {
        id: 'PART-002',
        tournamentId: 'TOURN-PB-OCT2026',
        teamName: 'Java Padel Aces',
        player1Name: 'Reza Rahardian',
        player2Name: 'Dimas Anggara',
        categoryTariff: 'BEGINNER',
        feeAmount: 550000,
        paymentDate: '2026-09-07',
        bankReference: 'MANDIRI-TRF-98330',
        status: 'PAID_ACTIVE',
        sal06JournalId: 'JV-2026-09-0021'
      },
      {
        id: 'PART-003',
        tournamentId: 'TOURN-PB-OCT2026',
        teamName: 'Borobudur Warriors',
        player1Name: 'Gibran Rakabuming',
        player2Name: 'Kevin Sanjaya',
        categoryTariff: 'LOWER_BRONZE',
        feeAmount: 650000,
        paymentDate: '2026-09-10',
        bankReference: 'MANDIRI-TRF-98442',
        status: 'PAID_ACTIVE',
        sal06JournalId: 'JV-2026-09-0022'
      },
      {
        id: 'PART-004',
        tournamentId: 'TOURN-PB-OCT2026',
        teamName: 'Diponegoro Titans',
        player1Name: 'Agus Salim',
        player2Name: 'Doni Monardo',
        categoryTariff: 'LOWER_BRONZE',
        feeAmount: 650000,
        paymentDate: '2026-09-12',
        bankReference: 'MANDIRI-TRF-98511',
        status: 'PAID_ACTIVE',
        sal06JournalId: 'JV-2026-09-0023'
      }
    ]
  }
];

export const INITIAL_MODUL2_ACCRUALS: BentengSharingAccrual[] = [
  {
    id: 'ACCR-BTG-202608',
    batchNumber: 'SHR-BTG-20260831-01',
    ruleCode: 'SAL-08',
    date: '2026-08-31',
    unitId: 'U003',
    locationId: 'L005',
    periodLabel: 'Agustus 2026',
    grossSalesTurnover: 45000000,
    sharingPercentage: 0.15,
    accrualAmount: 6750000, // 15% x 45.000.000
    glJournalId: 'JV-2026-08-0050',
    processedBy: 'Finance Controller'
  }
];
