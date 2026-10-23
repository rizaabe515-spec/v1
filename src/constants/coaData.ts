import { ChartOfAccount } from '../types/erp';

export const ACCOUNT_KEYS = {
  // Current Assets
  CASH_PADEL: '1-1101',
  CASH_BAR: '1-1102',
  CASH_OPS: '1-1103',
  BANK_MANDIRI: '1-1104',
  BANK_BNI: '1-1105',
  CASH_BENTENG: '1-1106',
  AR_TRADE: '1-1201',
  AR_NON_TRADE: '1-1202',
  INV_RAW_MATERIALS: '1-1301',
  INV_BEVERAGES: '1-1302',
  INV_FOOD: '1-1303',
  INV_MERCHANDISE: '1-1304',
  INV_SUPPLIES: '1-1305',
  ADVANCE_EMPLOYEE: '1-1401',
  PREPAID_EXPENSES: '1-1402',

  // Non-Current Assets
  FA_COURT_CONSTRUCTION: '1-1501',
  ACCUM_DEP_COURT: '1-1502',
  FA_BAR_EQUIPMENT: '1-1503',
  ACCUM_DEP_BAR: '1-1504',
  FA_KITCHEN_EQUIPMENT: '1-1505',
  ACCUM_DEP_KITCHEN: '1-1506',
  FA_FURNITURE: '1-1507',
  ACCUM_DEP_FURNITURE: '1-1508',

  // Current Liabilities
  AP_TRADE: '2-1101',
  ACCRUED_EXPENSES: '2-1102',
  SALARY_PAYABLE: '2-1103',
  GRNI: '2-1104',
  TAX_PAYABLE_PB1: '2-1201',
  TAX_PAYABLE_PPH21: '2-1202',
  TAX_PAYABLE_PPH23: '2-1203',
  DEFERRED_REVENUE_TOURNAMENT: '2-1301',
  DEFERRED_REVENUE_MEMBERSHIP: '2-1302',
  DUE_RELATED_DKSI: '2-1401',
  BANK_LOAN_LONG_TERM: '2-1402',

  // Equity
  EQUITY_SHARE_CAPITAL: '3-1101',
  OWNER_CAPITAL_ADVANCE: '3-1102',
  RETAINED_EARNINGS: '3-1201',
  CURRENT_YEAR_EARNINGS: '3-1202',

  // Revenues (4-xxxx)
  REVENUE_PADEL_COURT: '4-1101',
  REVENUE_PADEL_EVENT: '4-1102',
  REVENUE_BAR_SALATIGA: '4-1103',
  REVENUE_KITCHEN_SALATIGA: '4-1104',
  REVENUE_COFFEE_BENTENG: '4-1105',
  REVENUE_EQUIPMENT_RENTAL: '4-1201',
  REVENUE_MERCHANDISE: '4-1301',
  REVENUE_OTHER_NON_OPERATIONAL: '4-1401',

  // Periodic COGS (5-xxxx)
  PURCHASE_PERIODIC: '5-1100',
  COGS_STOCK_OPNAME: '5-1200',
  WASTE_SPOILAGE: '5-1301',

  // Operational Expenses (6-xxxx)
  EXP_SALARY_WAGES: '6-1101',
  EXP_EMPLOYEE_BENEFITS: '6-1102',
  EXP_UTILITIES: '6-1201',
  EXP_RENT: '6-1202',
  EXP_MAINTENANCE: '6-1203',
  EXP_MARKETING_EVENT: '6-1204',
  EXP_CLEANING_SECURITY: '6-1205',
  EXP_OFFICE_SUPPLIES: '6-1206',
  EXP_DEPRECIATION: '6-1207',
  EXP_BANK_ADMIN: '6-1301',
  EXP_TAX_FINAL: '6-1401'
} as const;

export const CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // 1. Current Assets
  {
    accountCode: '1-1101',
    accountKey: 'CASH_PADEL',
    accountName: 'Kas Kecil Kasir Padel',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Uang tunai kasir reservasi lapangan padel',
    isBankCash: true
  },
  {
    accountCode: '1-1102',
    accountKey: 'CASH_BAR',
    accountName: 'Kas Kecil Bar Salatiga',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Uang tunai kasir F&B Bar Salatiga',
    isBankCash: true
  },
  {
    accountCode: '1-1103',
    accountKey: 'CASH_OPS',
    accountName: 'Kas Operasional Salatiga',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Kas kecil operasional kantor dan belanja lokal',
    isBankCash: true
  },
  {
    accountCode: '1-1104',
    accountKey: 'BANK_MANDIRI',
    accountName: 'Bank Mandiri Operasional',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Rekening giro penerimaan dan transfer utama PT Sport Universal Indonesia',
    isBankCash: true
  },
  {
    accountCode: '1-1105',
    accountKey: 'BANK_BNI',
    accountName: 'Bank BNI Holding / Collection',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Rekening penampungan QRIS & transfer holding PT Sport Universal Indonesia',
    isBankCash: true
  },
  {
    accountCode: '1-1106',
    accountKey: 'CASH_BENTENG',
    accountName: 'Kas Kecil Coffee Benteng',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Kas kecil operasional outlet Coffee Benteng Ambarawa',
    isBankCash: true
  },
  {
    accountCode: '1-1201',
    accountKey: 'AR_TRADE',
    accountName: 'Piutang Usaha Trade',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Tagihan sewa lapangan member / korporat'
  },
  {
    accountCode: '1-1202',
    accountKey: 'AR_NON_TRADE',
    accountName: 'Piutang Non-Usaha',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Piutang lain-lain non operasional'
  },
  {
    accountCode: '1-1301',
    accountKey: 'INV_RAW_MATERIALS',
    accountName: 'Persediaan Bahan Baku',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Biji kopi, sirup dasar, susu, dan bahan baku utama'
  },
  {
    accountCode: '1-1302',
    accountKey: 'INV_BEVERAGES',
    accountName: 'Persediaan Minuman Jadi & RTD',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Minuman kaleng/botol, isotonic water, dan RTD'
  },
  {
    accountCode: '1-1303',
    accountKey: 'INV_FOOD',
    accountName: 'Persediaan Makanan & Bahan Olahan',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Bahan masakan kitchen dan pastry'
  },
  {
    accountCode: '1-1304',
    accountKey: 'INV_MERCHANDISE',
    accountName: 'Persediaan Merchandise & Bola Padel',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Bola padel, grip, jersey, dan aksesoris olah raga'
  },
  {
    accountCode: '1-1305',
    accountKey: 'INV_SUPPLIES',
    accountName: 'Persediaan Perlengkapan Operasional',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Cup plastik, tissue, sedotan, dan kemasan takeaway'
  },
  {
    accountCode: '1-1401',
    accountKey: 'ADVANCE_EMPLOYEE',
    accountName: 'Uang Muka Karyawan / Cash Advance',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Talangan kas operasional tim yang wajib dipertanggungjawabkan'
  },
  {
    accountCode: '1-1402',
    accountKey: 'PREPAID_EXPENSES',
    accountName: 'Beban Dibayar di Muka',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Asuransi, lisensi, dan sewa dibayar di muka'
  },

  // 2. Non-Current Assets
  {
    accountCode: '1-1501',
    accountKey: 'FA_COURT_CONSTRUCTION',
    accountName: 'Aset Tetap - Konstruksi Lapangan Padel',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Kaca tempered, karpet rumput sintetis, rangka baja lapangan'
  },
  {
    accountCode: '1-1502',
    accountKey: 'ACCUM_DEP_COURT',
    accountName: 'Akumulasi Penyusutan Lapangan Padel',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi penyusutan fisik lapangan padel'
  },
  {
    accountCode: '1-1503',
    accountKey: 'FA_BAR_EQUIPMENT',
    accountName: 'Aset Tetap - Mesin Espresso & Bar',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Mesin kopi komersial, grinder, blender, ice maker'
  },
  {
    accountCode: '1-1504',
    accountKey: 'ACCUM_DEP_BAR',
    accountName: 'Akumulasi Penyusutan Mesin Bar',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi penyusutan mesin dan peralatan bar'
  },
  {
    accountCode: '1-1505',
    accountKey: 'FA_KITCHEN_EQUIPMENT',
    accountName: 'Aset Tetap - Peralatan Kitchen',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Kompor komersial, freezer, chiller, exhaust hood'
  },
  {
    accountCode: '1-1506',
    accountKey: 'ACCUM_DEP_KITCHEN',
    accountName: 'Akumulasi Penyusutan Peralatan Kitchen',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi penyusutan perlengkapan kitchen'
  },
  {
    accountCode: '1-1507',
    accountKey: 'FA_FURNITURE',
    accountName: 'Aset Tetap - Meja, Kursi & Interior',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Furnitur area resto, tribun padel, dan tata cahaya'
  },
  {
    accountCode: '1-1508',
    accountKey: 'ACCUM_DEP_FURNITURE',
    accountName: 'Akumulasi Penyusutan Furniture',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi penyusutan interior dan furnitur'
  },

  // 3. Current Liabilities
  {
    accountCode: '2-1101',
    accountKey: 'AP_TRADE',
    accountName: 'Hutang Usaha / Trade AP',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Tagihan vendor supplier kopi, bahan baku, merchandise'
  },
  {
    accountCode: '2-1102',
    accountKey: 'ACCRUED_EXPENSES',
    accountName: 'Biaya Yang Masih Harus Dibayar',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akrual tagihan listrik, internet, dan jasa profesional'
  },
  {
    accountCode: '2-1103',
    accountKey: 'SALARY_PAYABLE',
    accountName: 'Hutang Gaji & Upah Karyawan',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akrual gaji akhir bulan sebelum tanggal transfer'
  },
  {
    accountCode: '2-1104',
    accountKey: 'GRNI',
    accountName: 'Hutang Barang Diterima Belum Ditagih (GRNI)',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akun kliring penerimaan barang GR-01 sebelum invoice vendor diterima'
  },
  {
    accountCode: '2-1201',
    accountKey: 'TAX_PAYABLE_PB1',
    accountName: 'Hutang Pajak PB1 / Resto',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pajak restoran 10% yang dipungut dari customer F&B'
  },
  {
    accountCode: '2-1202',
    accountKey: 'TAX_PAYABLE_PPH21',
    accountName: 'Hutang PPh 21 Karyawan',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Potongan pajak penghasilan tenaga kerja'
  },
  {
    accountCode: '2-1203',
    accountKey: 'TAX_PAYABLE_PPH23',
    accountName: 'Hutang PPh 23 / 4(2)',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Potongan pajak sewa dan jasa pihak ketiga'
  },
  {
    accountCode: '2-1301',
    accountKey: 'DEFERRED_REVENUE_TOURNAMENT',
    accountName: 'Pendapatan Diterima di Muka Turnamen Padel',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Uang pendaftaran turnamen sebelum event selesai (Anti-Omzet Palsu)'
  },
  {
    accountCode: '2-1302',
    accountKey: 'DEFERRED_REVENUE_MEMBERSHIP',
    accountName: 'Pendapatan Diterima di Muka Sewa Member',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Paket langganan main padel bulanan/tahunan'
  },
  {
    accountCode: '2-1401',
    accountKey: 'DUE_RELATED_DKSI',
    accountName: 'Hutang Pihak Berelasi PT DKSI',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pinjaman dana talangan afiliasi PT DKSI (Bukan Pendapatan)'
  },
  {
    accountCode: '2-1402',
    accountKey: 'BANK_LOAN_LONG_TERM',
    accountName: 'Hutang Bank Jangka Panjang',
    category: 'LIABILITY_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Fasilitas kredit investasi perbankan'
  },

  // 4. Equity
  {
    accountCode: '3-1101',
    accountKey: 'EQUITY_SHARE_CAPITAL',
    accountName: 'Modal Saham Disetor',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Modal resmi disetor perseroan sesuai akta'
  },
  {
    accountCode: '3-1102',
    accountKey: 'OWNER_CAPITAL_ADVANCE',
    accountName: 'Talangan Modal Pemilik',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Setoran dana dari pemilik untuk investasi/ekspansi (Bukan Pendapatan)'
  },
  {
    accountCode: '3-1201',
    accountKey: 'RETAINED_EARNINGS',
    accountName: 'Saldo Laba Ditahan',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Akumulasi laba bersih tahun-tahun sebelumnya'
  },
  {
    accountCode: '3-1202',
    accountKey: 'CURRENT_YEAR_EARNINGS',
    accountName: 'Laba / Rugi Tahun Berjalan',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Laba bersih kumulatif periode berjalan'
  },

  // 5. Revenues (4-xxxx)
  {
    accountCode: '4-1101',
    accountKey: 'REVENUE_PADEL_COURT',
    accountName: 'Pendapatan Sewa Lapangan Padel',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan slot sewa lapangan padel U001',
    isRevenue: true
  },
  {
    accountCode: '4-1102',
    accountKey: 'REVENUE_PADEL_EVENT',
    accountName: 'Pendapatan Event & Turnamen Padel',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penerimaan turnamen padel setelah closing resmi dan dikurangi refund (SAL-07)',
    isRevenue: true
  },
  {
    accountCode: '4-1103',
    accountKey: 'REVENUE_BAR_SALATIGA',
    accountName: 'Pendapatan F&B Bar Salatiga',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan minuman kopi & non-kopi di outlet Bar Salatiga (U002)',
    isRevenue: true
  },
  {
    accountCode: '4-1104',
    accountKey: 'REVENUE_KITCHEN_SALATIGA',
    accountName: 'Pendapatan F&B Kitchen Salatiga',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan makanan dapur & resto di outlet Salatiga (U002)',
    isRevenue: true
  },
  {
    accountCode: '4-1105',
    accountKey: 'REVENUE_COFFEE_BENTENG',
    accountName: 'Pendapatan Coffee Benteng Ambarawa',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan produk kopi di cabang Coffee Benteng (U003)',
    isRevenue: true
  },
  {
    accountCode: '4-1201',
    accountKey: 'REVENUE_EQUIPMENT_RENTAL',
    accountName: 'Pendapatan Sewa Raket & Bola',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Sewa raket sewa harian dan bola padel di venue',
    isRevenue: true
  },
  {
    accountCode: '4-1301',
    accountKey: 'REVENUE_MERCHANDISE',
    accountName: 'Pendapatan Penjualan Merchandise',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan jersey, overgrip, dan aksesoris padel',
    isRevenue: true
  },
  {
    accountCode: '4-1401',
    accountKey: 'REVENUE_OTHER_NON_OPERATIONAL',
    accountName: 'Pendapatan Lain-Lain Non-Operasional',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Bunga bank atau pendapatan insidental',
    isRevenue: true
  },

  // 6. Cost of Goods Sold / Periodic Inventory (5-xxxx)
  {
    accountCode: '5-1100',
    accountKey: 'PURCHASE_PERIODIC',
    accountName: 'Pembelian Persediaan Periodik',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Akun penampung seluruh pembelian barang persediaan saat GR-01 (Metode Periodik)'
  },
  {
    accountCode: '5-1200',
    accountKey: 'COGS_STOCK_OPNAME',
    accountName: 'Beban HPP Penyesuaian Stock Opname',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Akun HPP resmi GL yang dihitung dan dijurnal bulanan pasca Stock Opname (STK-07)'
  },
  {
    accountCode: '5-1301',
    accountKey: 'WASTE_SPOILAGE',
    accountName: 'Beban Kerusakan & Kadaluarsa Persediaan',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Penghapusan bahan baku rusak atau tumpah'
  },

  // 7. Operational & Overhead Expenses (6-xxxx)
  {
    accountCode: '6-1101',
    accountKey: 'EXP_SALARY_WAGES',
    accountName: 'Beban Gaji & Upah Karyawan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Gaji tetap, lembur, dan tunjangan kerja tim'
  },
  {
    accountCode: '6-1102',
    accountKey: 'EXP_EMPLOYEE_BENEFITS',
    accountName: 'Beban BPJS Ketenagakerjaan & Kesehatan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Iuran jamsostek dan asuransi kesehatan staf'
  },
  {
    accountCode: '6-1201',
    accountKey: 'EXP_UTILITIES',
    accountName: 'Beban Listrik, Air & Internet',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Biaya PLN lampu lapangan, air PDAM, dan internet fiber'
  },
  {
    accountCode: '6-1202',
    accountKey: 'EXP_RENT',
    accountName: 'Beban Sewa Lahan & Bangunan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Sewa area venue padel dan outlet coffee shop'
  },
  {
    accountCode: '6-1203',
    accountKey: 'EXP_MAINTENANCE',
    accountName: 'Beban Pemeliharaan & Perbaikan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Service rutin AC, mesin espresso, ganti jaring & lampu court'
  },
  {
    accountCode: '6-1204',
    accountKey: 'EXP_MARKETING_EVENT',
    accountName: 'Beban Promosi & Sponsorship',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Iklan media sosial, poster turnamen, merchandise giveaway'
  },
  {
    accountCode: '6-1205',
    accountKey: 'EXP_CLEANING_SECURITY',
    accountName: 'Beban Kebersihan & Keamanan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Jasa cleaning service harian dan security shift malam'
  },
  {
    accountCode: '6-1206',
    accountKey: 'EXP_OFFICE_SUPPLIES',
    accountName: 'Beban ATK & Keperluan Kantor',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Kertas struk thermal, seragam kasir, perlengkapan admin'
  },
  {
    accountCode: '6-1207',
    accountKey: 'EXP_DEPRECIATION',
    accountName: 'Beban Penyusutan Aset Tetap',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Alokasi depresiasi bulanan mesin dan konstruksi'
  },
  {
    accountCode: '6-1301',
    accountKey: 'EXP_BANK_ADMIN',
    accountName: 'Beban Administrasi Bank & MDR QRIS',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Potongan MDR QRIS 0.7% dan biaya admin buku bank'
  },
  {
    accountCode: '6-1401',
    accountKey: 'EXP_TAX_FINAL',
    accountName: 'Beban Pajak PPh Final PP 23 (0.5%)',
    category: 'EXPENSE_TAX_OTHER',
    normalBalance: 'DEBIT',
    description: 'Pajak penghasilan final UMKM atas peredaran bruto'
  }
];

export const COA_MAP = new Map<string, ChartOfAccount>(
  CHART_OF_ACCOUNTS.map(coa => [coa.accountCode, coa])
);

export const COA_KEY_MAP = new Map<string, ChartOfAccount>(
  CHART_OF_ACCOUNTS.map(coa => [coa.accountKey, coa])
);

export function getAccountByCode(code: string): ChartOfAccount | undefined {
  return COA_MAP.get(code);
}

export function getAccountByKey(key: string): ChartOfAccount | undefined {
  return COA_KEY_MAP.get(key);
}
