import { 
  StockItem, 
  PurchaseOrder, 
  GoodsReceipt, 
  VendorBill, 
  TournamentEvent, 
  CourtBooking, 
  POSTransaction, 
  GLJournalEntry, 
  NonRevenueTransaction,
  StockOpnameSession
} from '../types/erp';
import { ACCOUNT_KEYS } from './coaData';

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    sku: 'BEV-COF-001',
    name: 'House Blend Espresso Beans (1kg)',
    category: 'RAW_MATERIALS',
    unit: 'pack',
    costAccountKey: 'INV_RAW_MATERIALS',
    stockByLocation: {
      L001: 0,
      L002: 45, // Gudang Pusat
      L003: 12, // Bar Salatiga
      L004: 0,
      L005: 8   // Coffee Benteng
    },
    averageUnitCost: 185000
  },
  {
    sku: 'BEV-MLK-001',
    name: 'Fresh Milk Pasteurisasi 1 Liter',
    category: 'RAW_MATERIALS',
    unit: 'karton',
    costAccountKey: 'INV_RAW_MATERIALS',
    stockByLocation: {
      L001: 0,
      L002: 20,
      L003: 15,
      L004: 4,
      L005: 10
    },
    averageUnitCost: 220000
  },
  {
    sku: 'BEV-SYR-001',
    name: 'Vanilla Syrup Gourmet 750ml',
    category: 'RAW_MATERIALS',
    unit: 'botol',
    costAccountKey: 'INV_RAW_MATERIALS',
    stockByLocation: {
      L001: 0,
      L002: 18,
      L003: 6,
      L004: 0,
      L005: 4
    },
    averageUnitCost: 145000
  },
  {
    sku: 'BEV-ISO-001',
    name: 'Pocari Sweat Can 330ml',
    category: 'BEVERAGES',
    unit: 'karton',
    costAccountKey: 'INV_BEVERAGES',
    stockByLocation: {
      L001: 15,
      L002: 30,
      L003: 8,
      L004: 0,
      L005: 6
    },
    averageUnitCost: 168000
  },
  {
    sku: 'KIT-MEAT-001',
    name: 'Daging Sapi Ribeye Slice 1kg',
    category: 'FOOD',
    unit: 'kg',
    costAccountKey: 'INV_FOOD',
    stockByLocation: {
      L001: 0,
      L002: 10,
      L003: 0,
      L004: 14, // Kitchen Salatiga
      L005: 0
    },
    averageUnitCost: 195000
  },
  {
    sku: 'PAD-BAL-001',
    name: 'Head Padel Pro S (Can of 3)',
    category: 'MERCHANDISE',
    unit: 'can',
    costAccountKey: 'INV_MERCHANDISE',
    stockByLocation: {
      L001: 85, // Court Ops
      L002: 120,
      L003: 0,
      L004: 0,
      L005: 0
    },
    averageUnitCost: 110000
  },
  {
    sku: 'PAD-GRP-001',
    name: 'Padel Beans Overgrip Pro Dry',
    category: 'MERCHANDISE',
    unit: 'pcs',
    costAccountKey: 'INV_MERCHANDISE',
    stockByLocation: {
      L001: 65,
      L002: 150,
      L003: 0,
      L004: 0,
      L005: 0
    },
    averageUnitCost: 28000
  },
  {
    sku: 'SUP-CUP-001',
    name: 'Cold Cup PET 16oz + Strawless Lid (Pack 50)',
    category: 'SUPPLIES',
    unit: 'pack',
    costAccountKey: 'INV_SUPPLIES',
    stockByLocation: {
      L001: 0,
      L002: 40,
      L003: 18,
      L004: 5,
      L005: 12
    },
    averageUnitCost: 55000
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-101',
    poNumber: 'PO-2026-09-001',
    date: '2026-09-10',
    vendorName: 'PT Roastery Kopi Nusantara',
    unitId: 'U002',
    status: 'RECEIVED',
    totalAmount: 9250000,
    lines: [
      {
        id: 'po-line-101-1',
        sku: 'BEV-COF-001',
        itemName: 'House Blend Espresso Beans (1kg)',
        orderedQty: 50,
        unitPrice: 185000,
        unit: 'pack',
        targetLocationId: 'L002'
      }
    ]
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-09-002',
    date: '2026-09-14',
    vendorName: 'CV Sumber Segar Utama',
    unitId: 'U002',
    status: 'RECEIVED',
    totalAmount: 6600000,
    lines: [
      {
        id: 'po-line-102-1',
        sku: 'BEV-MLK-001',
        itemName: 'Fresh Milk Pasteurisasi 1 Liter',
        orderedQty: 30,
        unitPrice: 220000,
        unit: 'karton',
        targetLocationId: 'L002'
      }
    ]
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-09-003',
    date: '2026-09-18',
    vendorName: 'PT Sport Apparel & Gear',
    unitId: 'U001',
    status: 'RECEIVED',
    totalAmount: 11000000,
    lines: [
      {
        id: 'po-line-103-1',
        sku: 'PAD-BAL-001',
        itemName: 'Head Padel Pro S (Can of 3)',
        orderedQty: 100,
        unitPrice: 110000,
        unit: 'can',
        targetLocationId: 'L002'
      }
    ]
  }
];

export const INITIAL_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'gr-201',
    grNumber: 'GR-2026-09-001',
    poId: 'po-101',
    poNumber: 'PO-2026-09-001',
    date: '2026-09-12',
    vendorName: 'PT Roastery Kopi Nusantara',
    lines: [
      {
        id: 'gr-line-201-1',
        poLineId: 'po-line-101-1',
        sku: 'BEV-COF-001',
        itemName: 'House Blend Espresso Beans (1kg)',
        receivedQty: 50,
        unitPrice: 185000,
        locationId: 'L002'
      }
    ],
    totalValue: 9250000,
    isBilled: true,
    status: 'INVOICED',
    glJournalId: 'jnl-gr-001'
  },
  {
    id: 'gr-202',
    grNumber: 'GR-2026-09-002',
    poId: 'po-102',
    poNumber: 'PO-2026-09-002',
    date: '2026-09-16',
    vendorName: 'CV Sumber Segar Utama',
    lines: [
      {
        id: 'gr-line-202-1',
        poLineId: 'po-line-102-1',
        sku: 'BEV-MLK-001',
        itemName: 'Fresh Milk Pasteurisasi 1 Liter',
        receivedQty: 30,
        unitPrice: 220000,
        locationId: 'L002'
      }
    ],
    totalValue: 6600000,
    isBilled: false, // Ready for matching demonstration
    status: 'RECEIVED',
    glJournalId: 'jnl-gr-002'
  },
  {
    id: 'gr-203',
    grNumber: 'GR-2026-09-003',
    poId: 'po-103',
    poNumber: 'PO-2026-09-003',
    date: '2026-09-20',
    vendorName: 'PT Sport Apparel & Gear',
    lines: [
      {
        id: 'gr-line-203-1',
        poLineId: 'po-line-103-1',
        sku: 'PAD-BAL-001',
        itemName: 'Head Padel Pro S (Can of 3)',
        receivedQty: 100,
        unitPrice: 110000,
        locationId: 'L002'
      }
    ],
    totalValue: 11000000,
    isBilled: false,
    status: 'RECEIVED',
    glJournalId: 'jnl-gr-003'
  }
];

export const INITIAL_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'bill-301',
    billNumber: 'BILL-2026-09-001',
    vendorInvoiceNumber: 'INV-RKN-8891',
    poId: 'po-101',
    poNumber: 'PO-2026-09-001',
    grId: 'gr-201',
    grNumber: 'GR-2026-09-001',
    date: '2026-09-15',
    vendorName: 'PT Roastery Kopi Nusantara',
    lines: [
      {
        id: 'bill-line-301-1',
        poLineId: 'po-line-101-1',
        grLineId: 'gr-line-201-1',
        sku: 'BEV-COF-001',
        itemName: 'House Blend Espresso Beans (1kg)',
        invoicedQty: 50,
        invoicedUnitPrice: 185000,
        grQty: 50,
        poUnitPrice: 185000,
        priceVariance: 0,
        priceVariancePercent: 0,
        qtyVariance: 0,
        hasPriceViolation: false,
        hasQtyViolation: false
      }
    ],
    subtotal: 9250000,
    taxAmount: 0,
    totalAmount: 9250000,
    matchingStatus: 'AUTO_PASSED',
    glJournalId: 'jnl-ap-001'
  }
];

export const INITIAL_TOURNAMENTS: TournamentEvent[] = [
  {
    id: 'tour-01',
    name: 'Padel Beans Open Series I Salatiga 2026',
    startDate: '2026-08-25',
    endDate: '2026-09-06', // Crosses August into September
    status: 'SETTLED',
    entryFeePerParticipant: 750000,
    totalRegisteredParticipants: 32,
    totalCollectedPrepayment: 24000000, // Credited to 2-1301 on SAL-06
    totalRefunds: 1500000, // 2 participants withdrew
    netRevenue: 22500000, // Reclassified to 4-1102 on SAL-07
    sal06JournalIds: ['jnl-sal-06-tour01'],
    sal07JournalId: 'jnl-sal-07-tour01'
  },
  {
    id: 'tour-02',
    name: 'Central Java Masters Padel Cup 2026',
    startDate: '2026-10-15',
    endDate: '2026-11-02', // Ongoing cross-month event
    status: 'IN_PROGRESS',
    entryFeePerParticipant: 1000000,
    totalRegisteredParticipants: 24,
    totalCollectedPrepayment: 24000000, // Sitting safely in 2-1301!
    totalRefunds: 0,
    netRevenue: 0, // NOT in revenue yet!
    sal06JournalIds: ['jnl-sal-06-tour02']
  }
];

export const INITIAL_NON_REVENUE_TRANSACTIONS: NonRevenueTransaction[] = [
  {
    id: 'nonrev-01',
    date: '2026-09-05',
    type: 'CASH_ADVANCE_RETURN',
    amount: 1250000,
    fromAccount: '1-1104 Bank Mandiri Operasional',
    toAccount: '1-1401 Uang Muka Karyawan / Cash Advance',
    glJournalId: 'jnl-ca-03-01',
    isRevenueAccountInvolved: false,
    auditVerified: true
  },
  {
    id: 'nonrev-02',
    date: '2026-09-10',
    type: 'DKSI_RELATED_LOAN',
    amount: 50000000,
    fromAccount: '1-1104 Bank Mandiri Operasional',
    toAccount: '2-1401 Hutang Pihak Berelasi PT DKSI',
    glJournalId: 'jnl-fin-01-01',
    isRevenueAccountInvolved: false,
    auditVerified: true
  },
  {
    id: 'nonrev-03',
    date: '2026-09-18',
    type: 'OWNER_FUNDING',
    amount: 25000000,
    fromAccount: '1-1104 Bank Mandiri Operasional',
    toAccount: '3-1102 Talangan Modal Pemilik',
    glJournalId: 'jnl-fin-02-01',
    isRevenueAccountInvolved: false,
    auditVerified: true
  },
  {
    id: 'nonrev-04',
    date: '2026-09-22',
    type: 'INTERBANK_TRANSFER',
    amount: 15000000,
    fromAccount: '1-1104 Bank Mandiri Operasional',
    toAccount: '1-1105 Bank BNI Holding / Collection',
    glJournalId: 'jnl-fin-03-01',
    isRevenueAccountInvolved: false,
    auditVerified: true
  }
];

export const INITIAL_COURT_BOOKINGS: CourtBooking[] = [
  {
    id: 'bk-001',
    bookingCode: 'PB-BK-20260920-01',
    courtName: 'Court 1 (Panoramic Central)',
    customerName: 'Bambang Soedjarwo',
    phone: '081234567890',
    date: '2026-09-20',
    startTime: '16:00',
    endTime: '18:00',
    rentalFee: 450000,
    equipmentFee: 50000,
    totalAmount: 500000,
    paymentMethod: 'QRIS_BNI',
    glJournalId: 'jnl-sal-01-bk01',
    status: 'PLAYED'
  },
  {
    id: 'bk-002',
    bookingCode: 'PB-BK-20260921-02',
    courtName: 'Court 2 (Standard Pro)',
    customerName: 'Regina Amanda',
    phone: '081398765432',
    date: '2026-09-21',
    startTime: '19:00',
    endTime: '21:00',
    rentalFee: 400000,
    equipmentFee: 0,
    totalAmount: 400000,
    paymentMethod: 'MANDIRI_TRANSFER',
    glJournalId: 'jnl-sal-01-bk02',
    status: 'PLAYED'
  },
  {
    id: 'bk-003',
    bookingCode: 'PB-BK-20260922-03',
    courtName: 'Court 3 (Rooftop Open)',
    customerName: 'Dimas Wicaksono',
    phone: '081512345678',
    date: '2026-09-22',
    startTime: '08:00',
    endTime: '10:00',
    rentalFee: 350000,
    equipmentFee: 60000,
    totalAmount: 410000,
    paymentMethod: 'CASH',
    glJournalId: 'jnl-sal-01-bk03',
    status: 'CONFIRMED'
  }
];

export const INITIAL_POS_ORDERS: POSTransaction[] = [
  {
    id: 'pos-001',
    receiptNumber: 'POS-BAR-20260920-001',
    timestamp: '2026-09-20 17:35:00',
    unitId: 'U002',
    locationId: 'L003',
    cashierName: 'Arya (Bar Salatiga)',
    items: [
      { sku: 'BEV-COF-001', name: 'Iced Spanish Latte', price: 32000, qty: 2, subtotal: 64000 },
      { sku: 'BEV-ISO-001', name: 'Pocari Sweat Can', price: 15000, qty: 2, subtotal: 30000 }
    ],
    subtotal: 94000,
    tax: 9400,
    total: 103400,
    paymentAccountCode: '1-1102', // Kas Kecil Bar
    revenueAccountCode: '4-1103', // Pendapatan Bar Salatiga
    glJournalId: 'jnl-pos-001',
    cogsRuleStatus: 'DISABLED_PERIODIC_ACTIVE'
  },
  {
    id: 'pos-002',
    receiptNumber: 'POS-KIT-20260920-002',
    timestamp: '2026-09-20 18:15:00',
    unitId: 'U002',
    locationId: 'L004',
    cashierName: 'Dewi (Kitchen Salatiga)',
    items: [
      { sku: 'KIT-MEAT-001', name: 'Beef Padel Rice Bowl', price: 48000, qty: 2, subtotal: 96000 }
    ],
    subtotal: 96000,
    tax: 9600,
    total: 105600,
    paymentAccountCode: '1-1104', // Mandiri
    revenueAccountCode: '4-1104', // Pendapatan Kitchen Salatiga
    glJournalId: 'jnl-pos-002',
    cogsRuleStatus: 'DISABLED_PERIODIC_ACTIVE'
  },
  {
    id: 'pos-003',
    receiptNumber: 'POS-BTG-20260921-003',
    timestamp: '2026-09-21 14:20:00',
    unitId: 'U003',
    locationId: 'L005',
    cashierName: 'Fajar (Benteng Ambarawa)',
    items: [
      { sku: 'BEV-COF-001', name: 'Benteng Cold Brew Special', price: 28000, qty: 3, subtotal: 84000 }
    ],
    subtotal: 84000,
    tax: 8400,
    total: 92400,
    paymentAccountCode: '1-1106', // Kas Kecil Benteng
    revenueAccountCode: '4-1105', // Pendapatan Coffee Benteng
    glJournalId: 'jnl-pos-003',
    cogsRuleStatus: 'DISABLED_PERIODIC_ACTIVE'
  }
];

export const INITIAL_GL_JOURNALS: GLJournalEntry[] = [
  // 1. Initial Capital & Setup
  {
    id: 'jnl-init-01',
    journalNumber: 'JV-2026-09-0001',
    date: '2026-09-01',
    ruleCode: 'INIT-CAPITAL',
    reference: 'AKTA-PENDIRIAN-01',
    description: 'Penyetoran Modal Awal Pemegang Saham PT Sport Universal Indonesia',
    idempotencyKey: 'idemp-init-capital-01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 500000000,
    totalCredit: 500000000,
    createdAt: '2026-09-01T08:00:00Z',
    createdBy: 'Direktur Utama',
    approvedBy: 'Komisaris',
    lines: [
      {
        id: 'jnl-init-line-1',
        journalId: 'jnl-init-01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 500000000,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Setoran modal kas ke rekening giro Mandiri'
      },
      {
        id: 'jnl-init-line-2',
        journalId: 'jnl-init-01',
        accountCode: '3-1101',
        accountKey: 'EQUITY_SHARE_CAPITAL',
        accountName: 'Modal Saham Disetor',
        debit: 0,
        credit: 500000000,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Pencatatan modal saham disetor PT Sport Universal Indonesia'
      }
    ]
  },

  // 2. Tournament 1 Advance Payment (SAL-06)
  {
    id: 'jnl-sal-06-tour01',
    journalNumber: 'JV-2026-09-0002',
    date: '2026-09-01',
    ruleCode: 'SAL-06',
    reference: 'REG-SERIES1-32PAIRS',
    description: 'Penerimaan Uang Muka Registrasi Turnamen Series I (Anti-Omzet Palsu)',
    idempotencyKey: 'idemp-sal06-tour01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 24000000,
    totalCredit: 24000000,
    createdAt: '2026-09-01T10:00:00Z',
    createdBy: 'Finance Admin',
    approvedBy: 'Accounting Supervisor',
    lines: [
      {
        id: 'jnl-line-s06-1',
        journalId: 'jnl-sal-06-tour01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 24000000,
        credit: 0,
        unitId: 'U001',
        locationId: 'L001',
        description: 'Penerimaan dana pendaftaran turnamen 32 pasang @ Rp 750rb'
      },
      {
        id: 'jnl-line-s06-2',
        journalId: 'jnl-sal-06-tour01',
        accountCode: '2-1301',
        accountKey: 'DEFERRED_REVENUE_TOURNAMENT',
        accountName: 'Pendapatan Diterima di Muka Turnamen Padel',
        debit: 0,
        credit: 24000000,
        unitId: 'U001',
        locationId: 'L001',
        description: 'Liabilitas uang muka turnamen sebelum selesai (Bukan Pendapatan)'
      }
    ]
  },

  // 3. Tournament 1 Closing Settlement & Refund (SAL-07)
  {
    id: 'jnl-sal-07-tour01',
    journalNumber: 'JV-2026-09-0003',
    date: '2026-09-07',
    ruleCode: 'SAL-07',
    reference: 'CLOSING-SERIES1-FINAL',
    description: 'Reklasifikasi Pendapatan Turnamen Series I Selesai & Refund 2 Pasang',
    idempotencyKey: 'idemp-sal07-tour01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 24000000,
    totalCredit: 24000000,
    createdAt: '2026-09-07T14:30:00Z',
    createdBy: 'Finance Admin',
    approvedBy: 'Head of Accounting',
    lines: [
      {
        id: 'jnl-line-s07-1',
        journalId: 'jnl-sal-07-tour01',
        accountCode: '2-1301',
        accountKey: 'DEFERRED_REVENUE_TOURNAMENT',
        accountName: 'Pendapatan Diterima di Muka Turnamen Padel',
        debit: 24000000,
        credit: 0,
        unitId: 'U001',
        locationId: 'L001',
        description: 'Penutupan saldo liabilitas turnamen selesai'
      },
      {
        id: 'jnl-line-s07-2',
        journalId: 'jnl-sal-07-tour01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 0,
        credit: 1500000,
        unitId: 'U001',
        locationId: 'L001',
        description: 'Transfer refund 2 peserta yang mundur karena cedera'
      },
      {
        id: 'jnl-line-s07-3',
        journalId: 'jnl-sal-07-tour01',
        accountCode: '4-1102',
        accountKey: 'REVENUE_PADEL_EVENT',
        accountName: 'Pendapatan Event & Turnamen Padel',
        debit: 0,
        credit: 22500000,
        unitId: 'U001',
        locationId: 'L001',
        description: 'Pengakuan resmi omzet turnamen netto setelah refund disetujui'
      }
    ]
  },

  // 4. Goods Receipt 1 (GR-01): Dr 5-1100 / Cr 2-1104 (GRNI)
  {
    id: 'jnl-gr-001',
    journalNumber: 'JV-2026-09-0004',
    date: '2026-09-12',
    ruleCode: 'GR-01',
    reference: 'GR-2026-09-001',
    description: 'Penerimaan Persediaan Kopi dari PT Roastery Kopi Nusantara (Metode Periodik)',
    idempotencyKey: 'idemp-gr-001',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 9250000,
    totalCredit: 9250000,
    createdAt: '2026-09-12T11:00:00Z',
    createdBy: 'Warehouse Officer',
    approvedBy: 'Purchasing Head',
    lines: [
      {
        id: 'jnl-line-gr1-1',
        journalId: 'jnl-gr-001',
        accountCode: '5-1100',
        accountKey: 'PURCHASE_PERIODIC',
        accountName: 'Pembelian Persediaan Periodik',
        debit: 9250000,
        credit: 0,
        unitId: 'U002',
        locationId: 'L002',
        description: 'Pembelian persediaan periodik 50 pack House Blend'
      },
      {
        id: 'jnl-line-gr1-2',
        journalId: 'jnl-gr-001',
        accountCode: '2-1104',
        accountKey: 'GRNI',
        accountName: 'Hutang Barang Diterima Belum Ditagih (GRNI)',
        debit: 0,
        credit: 9250000,
        unitId: 'U002',
        locationId: 'L002',
        description: 'Akrual kliring barang diterima belum ada invoice vendor'
      }
    ]
  },

  // 5. Vendor Bill 1 (AP-01): 3-Way Match Passed -> Dr 2-1104 / Cr 2-1101
  {
    id: 'jnl-ap-001',
    journalNumber: 'JV-2026-09-0005',
    date: '2026-09-15',
    ruleCode: 'AP-01',
    reference: 'BILL-2026-09-001',
    description: 'Pengakuan Hutang Usaha Vendor Kopi (3-Way Match Passed)',
    idempotencyKey: 'idemp-ap-001',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 9250000,
    totalCredit: 9250000,
    createdAt: '2026-09-15T15:00:00Z',
    createdBy: 'AP Staff',
    approvedBy: 'Head of Accounting',
    lines: [
      {
        id: 'jnl-line-ap1-1',
        journalId: 'jnl-ap-001',
        accountCode: '2-1104',
        accountKey: 'GRNI',
        accountName: 'Hutang Barang Diterima Belum Ditagih (GRNI)',
        debit: 9250000,
        credit: 0,
        unitId: 'U002',
        locationId: 'L002',
        description: 'Kliring akun GRNI terhadap invoice vendor yang telah cocok'
      },
      {
        id: 'jnl-line-ap1-2',
        journalId: 'jnl-ap-001',
        accountCode: '2-1101',
        accountKey: 'AP_TRADE',
        accountName: 'Hutang Usaha / Trade AP',
        debit: 0,
        credit: 9250000,
        unitId: 'U002',
        locationId: 'L002',
        description: 'Pencatatan hutang dagang jatuh tempo 30 hari'
      }
    ]
  },

  // 6. Anti-Fraud Audit: Related Party Loan PT DKSI (FIN-01)
  {
    id: 'jnl-fin-01-01',
    journalNumber: 'JV-2026-09-0006',
    date: '2026-09-10',
    ruleCode: 'FIN-01',
    reference: 'AGREEMENT-DKSI-LOAN-01',
    description: 'Penerimaan Pinjaman Afiliasi PT DKSI (Strict Non-Revenue)',
    idempotencyKey: 'idemp-fin01-01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 50000000,
    totalCredit: 50000000,
    createdAt: '2026-09-10T09:30:00Z',
    createdBy: 'Finance Admin',
    approvedBy: 'Direktur Utama',
    lines: [
      {
        id: 'jnl-line-f1-1',
        journalId: 'jnl-fin-01-01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 50000000,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Penerimaan transfer pinjaman afiliasi ke Mandiri'
      },
      {
        id: 'jnl-line-f1-2',
        journalId: 'jnl-fin-01-01',
        accountCode: '2-1401',
        accountKey: 'DUE_RELATED_DKSI',
        accountName: 'Hutang Pihak Berelasi PT DKSI',
        debit: 0,
        credit: 50000000,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Kewajiban hutang pihak berelasi PT DKSI (Bukan Pendapatan)'
      }
    ]
  },

  // 7. Anti-Fraud Audit: Owner Funding (FIN-02)
  {
    id: 'jnl-fin-02-01',
    journalNumber: 'JV-2026-09-0007',
    date: '2026-09-18',
    ruleCode: 'FIN-02',
    reference: 'OWNER-ADV-202609',
    description: 'Talangan Modal Pemilik untuk Operasional (Strict Non-Revenue)',
    idempotencyKey: 'idemp-fin02-01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 25000000,
    totalCredit: 25000000,
    createdAt: '2026-09-18T10:00:00Z',
    createdBy: 'Finance Admin',
    approvedBy: 'Head of Accounting',
    lines: [
      {
        id: 'jnl-line-f2-1',
        journalId: 'jnl-fin-02-01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 25000000,
        credit: 0,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Penerimaan dana segar dari owner ke giro Mandiri'
      },
      {
        id: 'jnl-line-f2-2',
        journalId: 'jnl-fin-02-01',
        accountCode: '3-1102',
        accountKey: 'OWNER_CAPITAL_ADVANCE',
        accountName: 'Talangan Modal Pemilik',
        debit: 0,
        credit: 25000000,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Kredit akun ekuitas talangan pemilik (Bukan Pendapatan)'
      }
    ]
  },

  // 8. Shared Common Cost in U009 (Listrik PLN Lapangan & Resto)
  {
    id: 'jnl-exp-u009-01',
    journalNumber: 'JV-2026-09-0008',
    date: '2026-09-20',
    ruleCode: 'EXP-COMMON',
    reference: 'PLN-SALATIGA-202609',
    description: 'Pembayaran Rekening Listrik PLN Terpusat Salatiga (Shared Overhead U009)',
    idempotencyKey: 'idemp-exp-u009-01',
    status: 'POSTED',
    isBalanced: true,
    totalDebit: 12000000,
    totalCredit: 12000000,
    createdAt: '2026-09-20T11:00:00Z',
    createdBy: 'General Affairs',
    approvedBy: 'Finance Head',
    lines: [
      {
        id: 'jnl-line-u9-1',
        journalId: 'jnl-exp-u009-01',
        accountCode: '6-1201',
        accountKey: 'EXP_UTILITIES',
        accountName: 'Beban Listrik, Air & Internet',
        debit: 12000000,
        credit: 0,
        unitId: 'U009', // Recorded under U009, allocated report-only
        locationId: 'L002',
        description: 'Tagihan listrik gardu utama venue padel dan resto'
      },
      {
        id: 'jnl-line-u9-2',
        journalId: 'jnl-exp-u009-01',
        accountCode: '1-1104',
        accountKey: 'BANK_MANDIRI',
        accountName: 'Bank Mandiri Operasional',
        debit: 0,
        credit: 12000000,
        unitId: 'U009',
        locationId: 'L002',
        description: 'Autodebit Bank Mandiri bayar PLN'
      }
    ]
  }
];

export const INITIAL_STOCK_OPNAME_SESSIONS: StockOpnameSession[] = [
  {
    id: 'opn-2026-08',
    sessionNumber: 'OPN-2026-08-L003',
    periodMonth: '2026-08',
    locationId: 'L003',
    date: '2026-08-31',
    status: 'POSTED',
    glJournalId: 'jnl-stk-07-aug',
    conductedBy: 'Arya (Bar Leader)',
    approvedBy: 'Head of Accounting',
    totalVarianceValue: -185000, // Small shrinkage
    lines: [
      {
        sku: 'BEV-COF-001',
        itemName: 'House Blend Espresso Beans (1kg)',
        locationId: 'L003',
        systemQty: 15,
        physicalQty: 14,
        varianceQty: -1,
        unitCost: 185000,
        varianceValue: -185000
      },
      {
        sku: 'BEV-MLK-001',
        itemName: 'Fresh Milk Pasteurisasi 1 Liter',
        locationId: 'L003',
        systemQty: 12,
        physicalQty: 12,
        varianceQty: 0,
        unitCost: 220000,
        varianceValue: 0
      }
    ]
  }
];
