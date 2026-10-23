/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Konfigurasi 58 AccountKey COA (Sheet Mapping_COA_Final V1.3)
 * Berisi seluruh AccountKey logis, kode akun definitif, kategori, normal balance, dan aturan kontekstual.
 */

import { AccountKeyConfig } from '../types/module1';

export const MAPPING_COA_FINAL: AccountKeyConfig[] = [
  // ==========================================
  // 1. KAS, BANK & PIUTANG (1-1xxx)
  // ==========================================
  {
    accountKey: 'CASH_ON_HAND',
    definitiveAccountCode: '1-1101',
    accountName: 'Kas Kecil / Cash on Hand',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Uang fisik tunai kasir operasional court dan cafe',
    isActive: true,
    isBankCash: true
  },
  {
    accountKey: 'BANK_BNI',
    definitiveAccountCode: '1-1102',
    accountName: 'Bank BNI Operasional & Collection',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Rekening penampungan QRIS & transfer holding PT Sport Universal Indonesia',
    isActive: true,
    isBankCash: true
  },
  {
    accountKey: 'BANK_MANDIRI',
    definitiveAccountCode: '1-1103',
    accountName: 'Bank Mandiri Operasional',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Rekening giro pengeluaran dan penerimaan operasional utama',
    isActive: true,
    isBankCash: true
  },
  {
    accountKey: 'BANK_TRANSFER_TRANSIT',
    definitiveAccountCode: '1-1104',
    accountName: 'Kas / Bank Transit Antar Rekening',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Akun kliring perpindahan dana antar rekening bank (inter-bank transit)',
    isActive: true,
    isBankCash: true
  },
  {
    accountKey: 'PAYMENT_CLEARING',
    definitiveAccountCode: '1-1201',
    accountName: 'Kliring Pembayaran QRIS / EDC',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Penyelesaian settlement transaksi nontunai payment gateway H+1',
    isActive: true
  },
  {
    accountKey: 'AR_CUSTOMER',
    definitiveAccountCode: '1-1202',
    accountName: 'Piutang Pelanggan / Member',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Tagihan sewa lapangan member korporat & event',
    isActive: true
  },
  {
    accountKey: 'AR_EMPLOYEE',
    definitiveAccountCode: '1-1203',
    accountName: 'Piutang Karyawan',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Pinjaman internal karyawan yang dipotong dari gaji',
    isActive: true
  },
  {
    accountKey: 'AR_OTHER',
    definitiveAccountCode: '1-1204',
    accountName: 'Piutang Lain-Lain',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Piutang klaim asuransi atau pengembalian vendor',
    isActive: true
  },

  // ==========================================
  // 2. PERSEDIAAN (1-13xx)
  // ==========================================
  {
    accountKey: 'INV_COFFEE',
    definitiveAccountCode: '1-1301',
    accountName: 'Persediaan Kopi & Bahan Bar',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Biji kopi espresso, susu, sirup minuman Bar Salatiga & Benteng',
    isActive: true,
    isInventoryAsset: true
  },
  {
    accountKey: 'INV_RESTO',
    definitiveAccountCode: '1-1302',
    accountName: 'Persediaan Bahan Makanan Resto & Dapur',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Daging, saus, bumbu, dan bahan masakan Kitchen Salatiga',
    isActive: true,
    isInventoryAsset: true
  },
  {
    accountKey: 'INV_PACKAGING',
    definitiveAccountCode: '1-1303',
    accountName: 'Persediaan Kemasan & Packaging',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Cup take-away, lid, sedotan ramah lingkungan, dan paper bag',
    isActive: true,
    isInventoryAsset: true
  },
  {
    accountKey: 'INV_MERCH',
    definitiveAccountCode: '1-1304',
    accountName: 'Persediaan Merchandise & Aksesoris Padel',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Bola padel, raket sewa/jual, overgrip, jersey, tas padel',
    isActive: true,
    isInventoryAsset: true
  },
  {
    accountKey: 'INV_SUPPLIES',
    definitiveAccountCode: '1-1305',
    accountName: 'Persediaan Perlengkapan Operasional',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Sabun cuci, chemical pembersih mesin kopi, tisu, alat kebersihan',
    isActive: true,
    isInventoryAsset: true
  },

  // ==========================================
  // 3. UANG MUKA & BIAYA DIBAYAR DI MUKA (1-14xx)
  // ==========================================
  {
    accountKey: 'EMPLOYEE_ADVANCE',
    definitiveAccountCode: '1-1401',
    accountName: 'Uang Muka Karyawan / Cash Advance',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Talangan belanja operasional tim yang wajib dipertanggungjawabkan (Rule CA-03)',
    isActive: true
  },
  {
    accountKey: 'SUPPLIER_ADVANCE',
    definitiveAccountCode: '1-1402',
    accountName: 'Uang Muka Supplier / Vendor',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Deposit atau DP pemesanan bahan baku kepada supplier',
    isActive: true
  },
  {
    accountKey: 'VAT_INPUT_CLAIMABLE',
    definitiveAccountCode: '1-1403',
    accountName: 'PPN Masukan Dapat Dikreditkan',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Pajak Pertambahan Nilai masukan atas faktur pembelian barang kena pajak',
    isActive: true
  },
  {
    accountKey: 'PREPAID_EXPENSE',
    definitiveAccountCode: '1-1404',
    accountName: 'Beban Dibayar di Muka',
    category: 'ASSET_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Sewa tempat, asuransi, dan izin usaha dibayar di muka',
    isActive: true
  },

  // ==========================================
  // 4. ASET TETAP & CIP (1-15xx)
  // ==========================================
  {
    accountKey: 'ASSET_CIP',
    definitiveAccountCode: '1-1501',
    accountName: 'Konstruksi Dalam Pengerjaan (CIP)',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Akumulasi biaya pembangunan fisik lapangan padel atau renovasi outlet sebelum serah terima',
    isActive: true
  },
  {
    accountKey: 'ASSET_LEASEHOLD',
    definitiveAccountCode: '1-1502',
    accountName: 'Renovasi Bangunan Sewa (Leasehold)',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Partisi kaca lapangan padel, lantai rumput sintetis, dan dekorasi outlet',
    isActive: true
  },
  {
    accountKey: 'ASSET_FNB_EQUIPMENT',
    definitiveAccountCode: '1-1504',
    accountName: 'Peralatan Mesin Espresso & Dapur',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Mesin kopi La Marzocco/Sanremo, grinder, freezer, chiller resto',
    isActive: true
  },
  {
    accountKey: 'ASSET_SECURITY',
    definitiveAccountCode: '1-1505',
    accountName: 'Peralatan Keamanan & CCTV',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Sistem kamera pengawas IP Cam, alarm gerbang, dan akses kontrol venue',
    isActive: true
  },
  {
    accountKey: 'ASSET_FURNITURE',
    definitiveAccountCode: '1-1506',
    accountName: 'Meja, Kursi & Furnitur',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Kursi tribun penonton padel, set meja makan resto & cafe bar',
    isActive: true
  },
  {
    accountKey: 'ASSET_LANDSCAPE',
    definitiveAccountCode: '1-1508',
    accountName: 'Tata Ruang & Lapangan Luar (Landscape)',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'DEBIT',
    description: 'Paving area parkir, kanopi outdoor, dan tata tanaman venue',
    isActive: true
  },
  {
    accountKey: 'ACCUM_DEP_LEASEHOLD',
    definitiveAccountCode: '1-1592',
    accountName: 'Akumulasi Penyusutan Renovasi Sewa',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi amortisasi bangunan dan konstruksi lapangan',
    isActive: true
  },
  {
    accountKey: 'ACCUM_DEP_FNB',
    definitiveAccountCode: '1-1594',
    accountName: 'Akumulasi Penyusutan Mesin F&B',
    category: 'ASSET_NON_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akumulasi penyusutan mesin kopi dan peralatan dapur komersial',
    isActive: true
  },

  // ==========================================
  // 5. KEWAJIBAN & HUTANG USAHA (2-11xx .. 2-14xx)
  // ==========================================
  {
    accountKey: 'AP_GENERAL',
    definitiveAccountCode: '2-1101',
    accountName: 'Hutang Usaha Umum / Non-Stok',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Tagihan vendor jasa, utilitas, konsultan, dan operasional umum',
    isActive: true
  },
  {
    accountKey: 'AP_INVENTORY',
    definitiveAccountCode: '2-1102',
    accountName: 'Hutang Usaha Pembelian Persediaan',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Tagihan supplier biji kopi, susu, kemasan, dan bahan resto (Trade AP)',
    isActive: true
  },
  {
    accountKey: 'AP_CAPEX',
    definitiveAccountCode: '2-1103',
    accountName: 'Hutang Pengadaan Aset Tetap / Konstruksi',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Kewajiban termin kontraktor lapangan atau supplier mesin kopi',
    isActive: true
  },
  {
    accountKey: 'GRNI',
    definitiveAccountCode: '2-1104',
    accountName: 'Hutang Barang Diterima Belum Ditagih (GRNI)',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akun kliring penerimaan fisik GR-01 sebelum invoice vendor terverifikasi pada 3-way match',
    isActive: true
  },
  {
    accountKey: 'SHARING_PAYABLE_BENTENG',
    definitiveAccountCode: '2-1105',
    accountName: 'Hutang Bagi Hasil Cabang Benteng',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akrual kewajiban royalti / bagi hasil kepada pengelola situs Benteng Ambarawa',
    isActive: true
  },
  {
    accountKey: 'REFUND_PAYABLE',
    definitiveAccountCode: '2-1106',
    accountName: 'Hutang Pengembalian Dana / Refund Pelanggan',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Kewajiban refund peserta turnamen batal / sewa lapangan reschedule',
    isActive: true
  },
  {
    accountKey: 'ACCRUED_EXPENSE',
    definitiveAccountCode: '2-1107',
    accountName: 'Biaya Yang Masih Harus Dibayar',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Akrual tagihan listrik PLN, BPJS, dan internet akhir bulan',
    isActive: true
  },
  {
    accountKey: 'PBJT_PAYABLE',
    definitiveAccountCode: '2-1201', // Contextual: 2-1201 (Padel) / 2-1202 (Resto)
    accountName: 'Hutang PBJT (Pajak Barang & Jasa Tertentu)',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pajak Daerah 10% atas sewa sarana olahraga (2-1201) atau makanan/minuman resto (2-1202)',
    hasContextualResolution: true,
    contextRulesNotes: 'Context Unit U001 -> 2-1201 (PBJT Padel); Context Unit U002 / U003 -> 2-1202 (PBJT Resto/F&B)',
    isActive: true
  },
  {
    accountKey: 'VAT_OUTPUT_PAYABLE',
    definitiveAccountCode: '2-1203',
    accountName: 'PPN Keluaran Terutang',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pajak Pertambahan Nilai 11% yang dipungut atas penjualan barang kena pajak',
    isActive: true
  },
  {
    accountKey: 'WHT_21_PAYABLE',
    definitiveAccountCode: '2-1204',
    accountName: 'Hutang PPh Pasal 21 Karyawan',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pemotongan pajak penghasilan tenaga kerja tetap dan part-time',
    isActive: true
  },
  {
    accountKey: 'WHT_23_42_PAYABLE',
    definitiveAccountCode: '2-1205',
    accountName: 'Hutang PPh 23 / 4 ayat 2',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Potongan PPh 23 atas jasa pihak ketiga dan PPh 4(2) atas sewa lahan',
    isActive: true
  },
  {
    accountKey: 'UNEARNED_REV_EVENT',
    definitiveAccountCode: '2-1301',
    accountName: 'Pendapatan Diterima di Muka Turnamen Padel',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Uang muka pendaftaran turnamen padel sebelum event selesai (Rule SAL-06)',
    isActive: true
  },
  {
    accountKey: 'UNEARNED_REV_MEMBERSHIP',
    definitiveAccountCode: '2-1302',
    accountName: 'Pendapatan Diterima di Muka Sewa Member',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Paket langganan main padel berjangka (membership prepaid)',
    isActive: true
  },
  {
    accountKey: 'LOAN_RELATED_PARTY',
    definitiveAccountCode: '2-1401',
    accountName: 'Hutang Pihak Berelasi PT DKSI',
    category: 'LIABILITY_CURRENT',
    normalBalance: 'CREDIT',
    description: 'Pinjaman dana talangan afiliasi PT DKSI (Strict Non-Revenue, Rule FIN-01)',
    isActive: true
  },

  // ==========================================
  // 6. EKUITAS (3-xxxx)
  // ==========================================
  {
    accountKey: 'MODAL_AWAL',
    definitiveAccountCode: '3-1101',
    accountName: 'Modal Saham Disetor',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Modal disetor resmi perseroan sesuai Akta Pendirian',
    isActive: true
  },
  {
    accountKey: 'OWNER_ADVANCE_EQUITY',
    definitiveAccountCode: '3-1102',
    accountName: 'Talangan Modal Pemilik',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Setoran dana segar dari pemilik untuk ekspansi/operasional (Strict Non-Revenue, Rule FIN-02)',
    isActive: true
  },
  {
    accountKey: 'RETAINED_EARNINGS',
    definitiveAccountCode: '3-1201',
    accountName: 'Saldo Laba Ditahan',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Akumulasi laba bersih tahun-tahun sebelumnya',
    isActive: true
  },
  {
    accountKey: 'CURRENT_YEAR_PROFIT',
    definitiveAccountCode: '3-1202',
    accountName: 'Laba / Rugi Tahun Berjalan',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Laba bersih periode berjalan yang belum ditutup ke laba ditahan',
    isActive: true
  },

  // ==========================================
  // 7. PENDAPATAN & KONTRA (4-xxxx)
  // ==========================================
  {
    accountKey: 'REV_PADEL',
    definitiveAccountCode: '4-1101',
    accountName: 'Pendapatan Sewa Lapangan Padel',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan slot main padel harian dan reguler (Unit U001)',
    isActive: true,
    isRevenue: true
  },
  {
    accountKey: 'REV_PADEL_EVENT',
    definitiveAccountCode: '4-1102',
    accountName: 'Pendapatan Event & Turnamen Padel',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Omzet resmi turnamen padel pasca penutupan event dan dikurangi refund (Rule SAL-07)',
    isActive: true,
    isRevenue: true
  },
  {
    accountKey: 'REV_FNB',
    definitiveAccountCode: '4-1201',
    accountName: 'Pendapatan Penjualan Food & Beverage',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan minuman Bar Salatiga, makanan Kitchen Salatiga, dan outlet Benteng',
    isActive: true,
    isRevenue: true
  },
  {
    accountKey: 'REV_MERCH',
    definitiveAccountCode: '4-1301',
    accountName: 'Pendapatan Penjualan Merchandise & Raket',
    category: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Penjualan bola, jersey, sewa raket harian, dan aksesoris olahraga',
    isActive: true,
    isRevenue: true
  },
  {
    accountKey: 'SALES_RETURNS',
    definitiveAccountCode: '4-1901',
    accountName: 'Retur & Potongan Penjualan',
    category: 'REVENUE',
    normalBalance: 'DEBIT',
    description: 'Kontra pendapatan untuk diskon voucher promo atau pembatalan order',
    isActive: true
  },

  // ==========================================
  // 8. HPP & PEMBELIAN PERIODIK (5-xxxx)
  // ==========================================
  {
    accountKey: 'PERIODIC_PURCHASE',
    definitiveAccountCode: '5-1100',
    accountName: 'Pembelian Persediaan Periodik',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Akun penampung seluruh mutasi pembelian persediaan saat GR-01 dalam sistem inventori periodik',
    isActive: true
  },
  {
    accountKey: 'COGS_SALES',
    definitiveAccountCode: '5-1101', // Contextual: 5-1101 (Bar) / 5-1102 (Kitchen)
    accountName: 'HPP Penjualan (Beban Pokok Pendapatan)',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Beban HPP resmi bulanan hasil perhitungan formula periodik pasca stock opname fisik (Rule STK-07)',
    hasContextualResolution: true,
    contextRulesNotes: 'Context Lokasi L003 -> 5-1101 (HPP Bar); Context Lokasi L004 -> 5-1102 (HPP Kitchen); default 5-1101',
    isActive: true
  },
  {
    accountKey: 'STOCK_SHRINKAGE',
    definitiveAccountCode: '5-1107',
    accountName: 'Beban Selisih / Kerusakan Stok Fisik',
    category: 'COGS_PERIODIC',
    normalBalance: 'DEBIT',
    description: 'Kerugian selisih susut fisik, tumpah, atau kadaluarsa hasil stock opname',
    isActive: true
  },

  // ==========================================
  // 9. BEBAN OPERASIONAL (6-xxxx) & LAINNYA (7-xxxx)
  // ==========================================
  {
    accountKey: 'EXP_PAYROLL_STAFF',
    definitiveAccountCode: '6-1101',
    accountName: 'Beban Gaji & Upah Karyawan Tetap',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Gaji pokok bulanan staf admin, head barista, dan manajemen',
    isActive: true
  },
  {
    accountKey: 'EXP_PAYROLL_PARTTIME',
    definitiveAccountCode: '6-1102',
    accountName: 'Beban Upah Karyawan Part-Time & Harian',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Upah kasir paruh waktu, court marshal turnamen, dan kru tambahan',
    isActive: true
  },
  {
    accountKey: 'EXP_OVERTIME',
    definitiveAccountCode: '6-1103',
    accountName: 'Beban Uang Lembur Karyawan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Kompensasi lembur jam operasional malam dan akhir pekan',
    isActive: true
  },
  {
    accountKey: 'CREW_MEAL',
    definitiveAccountCode: '6-1104',
    accountName: 'Beban Konsumsi / Crew Meal Karyawan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Alokasi makanan harian staf operasional di outlet',
    isActive: true
  },
  {
    accountKey: 'EXP_ELECTRICITY',
    definitiveAccountCode: '6-1201',
    accountName: 'Beban Listrik PLN',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Tagihan listrik gardu penerangan lapangan padel, AC, dan mesin espresso',
    isActive: true
  },
  {
    accountKey: 'EXP_INTERNET',
    definitiveAccountCode: '6-1202',
    accountName: 'Beban Internet & WiFi Pelanggan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Langganan internet fiber optik untuk sistem POS kasir dan pengunjung',
    isActive: true
  },
  {
    accountKey: 'EXP_GAS',
    definitiveAccountCode: '6-1203',
    accountName: 'Beban Gas LPG Dapur Resto',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Konsumsi gas tabung LPG komersial untuk kompor Kitchen Salatiga',
    isActive: true
  },
  {
    accountKey: 'EXP_WATER',
    definitiveAccountCode: '6-1204',
    accountName: 'Beban Air Bersih / PDAM',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Retribusi pemakaian air PDAM untuk kamar bilas pemain padel dan resto',
    isActive: true
  },
  {
    accountKey: 'PAYMENT_FEES',
    definitiveAccountCode: '6-1301',
    accountName: 'Beban Administrasi Bank & MDR QRIS',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Fee Merchant Discount Rate (0.7%) QRIS dan biaya transfer antar-bank',
    isActive: true
  },
  {
    accountKey: 'EXP_FREIGHT',
    definitiveAccountCode: '6-1303',
    accountName: 'Beban Ekspedisi & Ongkos Kirim',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Biaya kirim biji kopi dari roastery atau bola padel dari distributor',
    isActive: true
  },
  {
    accountKey: 'EXP_PRINTING',
    definitiveAccountCode: '6-1304',
    accountName: 'Beban Percetakan & Kertas Struk',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Kertas thermal kasir POS, form reservasi, dan lanyard turnamen',
    isActive: true
  },
  {
    accountKey: 'EXP_SMALL_SUPPLIES',
    definitiveAccountCode: '6-1305',
    accountName: 'Beban Perlengkapan Kecil & ATK',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Ballpoint, binder clip, lakban, dan perlengkapan admin kantor',
    isActive: true
  },
  {
    accountKey: 'EXP_RETRIBUTION',
    definitiveAccountCode: '6-1306',
    accountName: 'Beban Retribusi & Kebersihan Lingkungan',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Iuran kebersihan sampah kawasan, keamanan lingkungan, dan paguyuban',
    isActive: true
  },
  {
    accountKey: 'EXP_EVENT',
    definitiveAccountCode: '6-1307',
    accountName: 'Beban Operasional Pelaksanaan Event',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Sewa sound system, fotografer turnamen, medali juara, dan hadiah',
    isActive: true
  },
  {
    accountKey: 'PROMO_EXPENSE',
    definitiveAccountCode: '6-1308',
    accountName: 'Beban Promosi & Marketing',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Iklan berbayar Instagram/TikTok, banner promo, dan endorsement komunitas',
    isActive: true
  },
  {
    accountKey: 'EXP_MAINT_PROD',
    definitiveAccountCode: '6-1401',
    accountName: 'Beban Pemeliharaan Mesin & Kitchen',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Descaling mesin espresso, servis kompor gas, dan penggantian filter air',
    isActive: true
  },
  {
    accountKey: 'EXP_MAINT_NONPROD',
    definitiveAccountCode: '6-1402',
    accountName: 'Beban Perbaikan Lapangan & Gedung',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Perbaikan jaring lapangan padel, servis lampu LED court, dan perbaikan atap',
    isActive: true
  },
  {
    accountKey: 'EXP_SHARING_BENTENG',
    definitiveAccountCode: '6-1403',
    accountName: 'Beban Bagi Hasil Pengelola Benteng',
    category: 'EXPENSE_OPERATIONAL',
    normalBalance: 'DEBIT',
    description: 'Biaya revenue-sharing kepada pihak pengelola kawasan cagar budaya Benteng',
    isActive: true
  },
  {
    accountKey: 'REV_BANK_INTEREST',
    definitiveAccountCode: '7-1101', // Contextual: 7-1101 (Income) / 7-2101 (Admin Exp)
    accountName: 'Pendapatan Bunga Bank / Beban Lain-Lain',
    category: 'OTHER_INCOME_EXPENSE',
    normalBalance: 'CREDIT',
    description: 'Jasa giro bank Mandiri/BNI (7-1101) atau beban biaya buku bank (7-2101)',
    hasContextualResolution: true,
    contextRulesNotes: 'Side CREDIT -> 7-1101 (Pendapatan Bunga Bank); Side DEBIT -> 7-2101 (Beban Administrasi Bank Lainnya)',
    isActive: true
  }
];

export const MAPPING_COA_MAP = new Map<string, AccountKeyConfig>(
  MAPPING_COA_FINAL.map(item => [item.accountKey, item])
);

export const DEFINITIVE_CODE_MAP = new Map<string, AccountKeyConfig>(
  MAPPING_COA_FINAL.map(item => [item.definitiveAccountCode, item])
);
